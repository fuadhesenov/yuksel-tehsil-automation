from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json
import httpx
from openai import OpenAI
from collections import defaultdict
import time

# Çevresel değişkenleri yükle
load_dotenv()

# Supabase PostgreSQL bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "")

app = FastAPI(
    title="Instagram DM Automation API",
    description="ManyChat + OpenAI GPT-4 Entegrasyon Backend'i",
    version="1.0.0"
)

# CORS - manual middleware (FastAPI CORSMiddleware bazen preflight header gondermez)
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return JSONResponse(
                content="OK",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "600",
                },
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(CORSMiddleware)

# OpenAI Client - env var yoksa None olsun, startup'da yeniden dene
_openai_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=_openai_key) if _openai_key else None

# Global sistem prompt
current_system_prompt = """Sən peşəkar bir Instagram asistentisən.
Defolt olaraq Azərbaycan dilində cavab ver."""

# Conversation history - subscriber_id bazında son mesajları saxla
conversation_history = defaultdict(list)
MAX_HISTORY = 10  # Hər istifadəçi üçün max 10 mesaj saxla
HISTORY_TTL = 3600  # 1 saat sonra sohbet sıfırla
conversation_timestamps = {}

# --- Pydantic Models ---
class WebhookPayload(BaseModel):
    id: int  # ManyChat contact ID
    last_input_text: str  # Kullanıcının son mesajı
    
    class Config:
        extra = "ignore"  # Ekstra alanları yoksay

class BriefData(BaseModel):
    """Tam işletmə profili - Təhsil Mərkəzi üçün"""
    
    # BÖLÜM 1: ƏSAS MƏLUMATLAR
    businessName: str  # 1. Mərkəzin rəsmi adı
    businessDescription: Optional[str] = ""  # 2. Qısa təsvir
    yearsInBusiness: Optional[str] = ""  # 3. Neçə ildir fəaliyyət göstərir
    mission: Optional[str] = ""  # 4. Missiya
    coreValues: Optional[str] = ""  # 5. Əsas dəyərlər
    
    # BÖLÜM 2: TƏHSİL PROQRAMLARI
    programsList: Optional[str] = ""  # 6. Proqramlar siyahısı (Bakalavr, Magistr, Doktorantura)
    programDetails: Optional[str] = ""  # 7. Proqram detalları (ölkələr, universitetlər)
    examPrep: Optional[str] = ""  # 8. İmtahan hazırlığı (YÖS, IELTS, SAT, TOEFL, DİM)
    languageCourses: Optional[str] = ""  # 9. Dil kursları (Türk dili, İngilis dili, Çin dili)
    targetCountries: Optional[str] = ""  # 10. Hədəf ölkələr (Türkiyə, Avropa)
    
    # BÖLÜM 3: QİYMƏTLƏR VƏ ŞƏRTLƏR
    pricingDetails: Optional[str] = ""  # 11. Qiymət cədvəli
    scholarshipInfo: Optional[str] = ""  # 12. Təqaüd imkanları
    packageDiscounts: Optional[str] = ""  # 13. Paket endirimləri
    paymentMethods: Optional[str] = ""  # 14. Ödəniş üsulları
    priceResponsePolicy: Optional[str] = ""  # 15. Qiymət soruşanda cavab siyasəti
    
    # BÖLÜM 4: İŞ SAATLARI VƏ MƏKAN
    workingDays: Optional[str] = ""  # 16. İş günləri
    workingHours: Optional[str] = ""  # 17. İş saatları
    holidaySchedule: Optional[str] = ""  # 18. Bayram günləri
    mainAddress: Optional[str] = ""  # 19. Əsas ünvan
    directionsInfo: Optional[str] = ""  # 20. Necə gəlmək olar
    otherBranches: Optional[str] = ""  # 21. Digər filiallar
    onlineServices: Optional[str] = ""  # 22. Onlayn xidmət
    
    # BÖLÜM 5: ƏLAQƏ VƏ QEYDİYYAT
    phoneNumber: Optional[str] = ""  # 23. Telefon
    email: Optional[str] = ""  # 24. Email
    website: Optional[str] = ""  # 25. Veb sayt
    socialMedia: Optional[str] = ""  # 26. Sosial media
    registrationProcess: Optional[str] = ""  # 27. Qeydiyyat prosesi
    
    # BÖLÜM 6: TƏZ-TƏZ SORUŞULAN SUALLAR
    faq: Optional[str] = ""  # 28. SSS və cavablar
    
    # BÖLÜM 7: ÜSLİP VƏ DİL
    preferredLanguage: Optional[str] = "Azərbaycan dili"  # 29. Dil
    communicationStyle: Optional[str] = ""  # 30. Rəsmi/samimi
    useEmojis: Optional[str] = ""  # 31. Emoji istifadəsi
    responseLength: Optional[str] = ""  # 32. Qısa/ətraflı cavablar
    
    # BÖLÜM 8: MƏHDUDIYYƏTLƏR
    mentionCompetitors: Optional[str] = ""  # 33. Rəqiblərdən danışılsınmı
    exactPricing: Optional[str] = ""  # 34. Dəqiq qiymət verilsinmi
    topicsToAvoid: Optional[str] = ""  # 35. Qaçınılacaq mövzular
    urgentCases: Optional[str] = ""  # 36. Təcili hallar
    complaintHandling: Optional[str] = ""  # 37. Şikayət idarəetməsi

class BriefPayload(BaseModel):
    briefData: BriefData

class PromptPayload(BaseModel):
    prompt: str

class TestPayload(BaseModel):
    message: str


# --- Database Functions (Supabase PostgreSQL with psycopg2) ---
def get_db_connection():
    """Veritabanı bağlantısı al"""
    if not DATABASE_URL:
        return None
    try:
        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"Veritabanı bağlantı hatası: {e}")
        return None

def init_database():
    """Veritabanı bağlantısını kontrol et"""
    if not DATABASE_URL:
        print("DATABASE_URL tanımlı değil!")
        return
    
    conn = get_db_connection()
    if conn:
        print("Veritabanı bağlantısı başarılı!")
        conn.close()

def load_config_sync():
    """Supabase'den config yükle (sync)"""
    if not DATABASE_URL:
        return {}
    
    conn = get_db_connection()
    if not conn:
        return {}
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT key, value FROM config")
            rows = cur.fetchall()
            config = {}
            for row in rows:
                val = row['value']
                if val is None:
                    config[row['key']] = None
                elif isinstance(val, str):
                    try:
                        config[row['key']] = json.loads(val)
                    except (json.JSONDecodeError, ValueError):
                        config[row['key']] = val
                else:
                    config[row['key']] = val
            print(f"Config yüklendi: {list(config.keys())}")
            return config
    except Exception as e:
        print(f"Config yükleme hatası: {e}")
        return {}
    finally:
        conn.close()

def save_config_sync(data: dict):
    """Config'i Supabase'e kaydet (sync)"""
    if not DATABASE_URL:
        print("DATABASE_URL tanımlı değil - config kaydedilemedi!")
        return
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cur:
            for key, value in data.items():
                json_value = json.dumps(value, ensure_ascii=False)
                # UPSERT - varsa güncelle, yoksa ekle
                cur.execute("""
                    INSERT INTO config (key, value, updated_at) 
                    VALUES (%s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (key) 
                    DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
                """, (key, json_value))
            conn.commit()
        print(f"Config Supabase'e kaydedildi!")
    except Exception as e:
        print(f"Config kaydetme hatası: {e}")
        conn.rollback()
    finally:
        conn.close()

def generate_prompt_with_ai(brief: BriefData) -> str:
    """Brief data'dan doğrudan sistem promptu oluştur - Təhsil Mərkəzi üçün"""
    
    return f"""Sən {brief.businessName} üçün peşəkar AI təhsil məsləhətçisisən - mərkəzin DİJİTAL İKİZİsən.
Instagram DM-lərdə tələbə namizədlərinə və valideynlərə cavab verirsən. Aşağıdakı məlumatları ƏZBƏR bilirsən və YALNIZ bu məlumatları istifadə edirsən.

════════════════════════════════════════
🔤 DİL QAYDALARI (ÇOX VACİB - HƏMİŞƏ RIAYƏT ET!)
════════════════════════════════════════
- Müştəri Azərbaycanca yazırsa → Azərbaycanca cavab ver
- Müştəri RUSCA yazırsa → MÜTLƏQ RUSCA cavab ver ("Здравствуйте", "Расскажите" və s.)
- Müştəri Türkcə yazırsa → Türkcə cavab ver
- Müştəri İngiliscə yazırsa → İngiliscə cavab ver
- HƏMİŞƏ müştərinin DİLİNDƏ cavab ver! Dil səhv etmə!
- Defolt dil: {brief.preferredLanguage}

════════════════════════════════════════
🧠 MESAJ ANLAMA QAYDALARI (ÇOX VACİB!)
════════════════════════════════════════
- Müştərilər YARIMPROFESSIONAL yazır! Yazım xətaları olacaq - SƏN ANLAMALISIN!
- Nümunələr:
  "qiymet nedi" = Qiymət nədir?
  "turkiyede oxumaq istiyrem" = Türkiyədə oxumaq istəyirəm
  "yos hazirligi" = YÖS hazırlığı
  "ielts kursu varmi" = IELTS kursu varmı?
  "magistr proqrami" = Magistr proqramı
  "neça puldı" = Neçəyədir? / Qiymət nədir?
  "hansi universitetlere" = Hansı universitetlərə?
  "burs imkani" = Təqaüd imkanı
- Yarım yamalaq, qrammatik səhvli, qısaldılmış mesajları DOĞRU BAŞ DÜŞ!
- Müştərinin NƏ İSTƏDİYİNİ anla, KONKRET və DƏQİQ cavab ver
- Əgər mesaj tam aydın deyilsə, ən məntiqi yozumu seç və cavab ver
- Əsla "Sualınızı başa düşmədim" demə - əvəzinə ən yaxın mənaya cavab ver

════════════════════════════════════════
🏢 MƏRKƏZ HAQQINDA
════════════════════════════════════════
Ad: {brief.businessName}
Təsvir: {brief.businessDescription}
Fəaliyyət müddəti: {brief.yearsInBusiness}
Missiya: {brief.mission}
Əsas dəyərlər: {brief.coreValues}

════════════════════════════════════════
🎓 TƏHSİL PROQRAMLARI
════════════════════════════════════════
Proqramlar: {brief.programsList}

Proqram detalları (ölkələr, universitetlər):
{brief.programDetails}

İmtahan hazırlığı (YÖS, IELTS, SAT, TOEFL, DİM):
{brief.examPrep}

Dil kursları:
{brief.languageCourses}

Hədəf ölkələr: {brief.targetCountries}

════════════════════════════════════════
💰 QİYMƏTLƏR (DƏQİQ MƏLUMAT)
════════════════════════════════════════
{brief.pricingDetails}

Təqaüd imkanları: {brief.scholarshipInfo}
Paket endirimləri: {brief.packageDiscounts}
Ödəniş üsulları: {brief.paymentMethods}

⚠️ Qiymət soruşanda: {brief.priceResponsePolicy}

════════════════════════════════════════
🕐 İŞ SAATLARI
════════════════════════════════════════
İş günləri: {brief.workingDays}
İş saatları: {brief.workingHours}
Bayramlar: {brief.holidaySchedule}

════════════════════════════════════════
📍 MƏKAN VƏ ÜNVAN (DİQQƏT: YALNIZ AŞAĞIDAKI ÜNVANLARI VER!)
════════════════════════════════════════
Əsas ünvan: {brief.mainAddress}
Gəliş yolu: {brief.directionsInfo}
Digər filiallar: {brief.otherBranches}
Onlayn xidmət: {brief.onlineServices}

⚠️ MƏKAN QAYDALARI:
- YALNIZ yuxarıdakı ünvanları istifadə et
- Ünvan soruşanda YALNIZ əsas ünvanı ver: {brief.mainAddress}

════════════════════════════════════════
📞 ƏLAQƏ MƏLUMATLARI (ÇOX VACİB!)
════════════════════════════════════════
Telefon: {brief.phoneNumber}
Email: {brief.email}
Veb sayt: {brief.website}
Sosial media: {brief.socialMedia}
Qeydiyyat: {brief.registrationProcess}

⚠️ TƏCİLİ HALLARDA: {brief.urgentCases}

════════════════════════════════════════
❓ TƏZ-TƏZ SORUŞULAN SUALLAR
════════════════════════════════════════
{brief.faq}

════════════════════════════════════════
🗣️ CAVAB VERMƏ QAYDALARI
════════════════════════════════════════
Dil: {brief.preferredLanguage}
Üslub: {brief.communicationStyle}
Emoji istifadəsi: {brief.useEmojis}
Cavab uzunluğu: {brief.responseLength}

════════════════════════════════════════
🚫 MƏHDUDIYYƏTLƏR
════════════════════════════════════════
- Rəqiblər haqqında: {brief.mentionCompetitors}
- Qaçınılacaq mövzular: {brief.topicsToAvoid}
- Şikayət idarəetməsi: {brief.complaintHandling}
- Linkləri aça bilmirsən - əlaqə məlumatlarını paylaş
- Bilmədiyin şeyi UYDURMA - "Dəqiq məlumat üçün bizimlə əlaqə saxlayın" de
- Sesli mesaj göndərilsə: "Təəssüf ki, sesli mesajları dinləyə bilmirəm. Zəhmət olmasa yazılı şəkildə göndərin 😊" de

════════════════════════════════════════
🎯 SATIŞ STRATEGİYASI (CƏVVAL OL!)
════════════════════════════════════════
1. Hər cavabda müştərini HƏRƏKƏTƏ keçməyə yönləndir:
   - "Pulsuz məsləhət üçün bizimlə əlaqə saxlayın!"
   - "WhatsApp-dan qeydiyyat: {brief.phoneNumber}"
   - "Zəng edin, yer ayıraq: {brief.phoneNumber}"
2. Sual soruşanda → cavab ver + "Pulsuz məsləhət almaq istərdiniz?" əlavə et
3. Qiymət soruşanda → qiymət ver + "İlk konsultasiya pulsuzdur, gəlin!" de
4. Maraq göstərəndə → dərhal qeydiyyat prosesini izah et
5. "Təşəkkür" və ya "sağ ol" desə → "Sizi gözləyirik! Qeydiyyat üçün: {brief.phoneNumber}" de

════════════════════════════════════════
🚫 MÖVZU XARICƏ ÇIXMA FİLTRİ
════════════════════════════════════════
- Müştəri təhsillə ƏLAQƏSIZ mövzu yazırsa (siyasət, din, şəxsi söhbət, zarafat və s.):
  → Qısa və nəzakətli cavab ver, sonra DƏRHAL mövzuya qaytar:
  → "Mən yalnız {brief.businessName} haqqında məlumat verə bilərəm. Təhsillə bağlı sualınız varsa, məmnuniyyətlə kömək edərəm! 📚"
- Uzun-uzadı söhbət edənlərə:
  → "Sizə necə kömək edə bilərəm? Proqramlarımız, qiymətlər və ya qeydiyyat haqqında soruşa bilərsiniz 😊"
- Boş və ya mənasız mesajlara:
  → Cavab vermə, yalnız konkret sualları cavabla

════════════════════════════════════════
⚡ KRİTİK QAYDALAR
════════════════════════════════════════
1. YALNIZ yuxarıdakı məlumatları istifadə et
2. Telefon soruşanda HƏMIŞƏ bu nömrələri ver: {brief.phoneNumber}
3. Ünvan soruşanda HƏMIŞƏ bu ünvanı ver: {brief.mainAddress}
4. Qiymət soruşanda dəqiq qiymətləri ver, sonra əlaqə saxlamağı məsləhət gör
5. HEÇ VAXT məlumat UYDURMA - bilmirsənsə əlaqə nömrəsini ver
6. Həmişə {brief.communicationStyle} ol və {brief.useEmojis} emoji istifadə et
7. Müştərinin DİLİNDƏ cavab ver - RUSCA sual = RUSCA cavab!
8. Hər cavabda satışa yönləndir - pulsuz konsultasiyanı təklif et
9. Konu xarici mesajlara qısa cavab ver, təhsilə qaytar
10. Təhsil sahəsindəki xüsusi terminləri düzgün istifadə et (YÖS, IELTS, SAT, TOEFL, DİM)"""

# --- Helper Functions ---
async def send_to_manychat(subscriber_id: str, message: str):
    manychat_key = os.getenv("MANYCHAT_API_KEY")
    flow_ns = os.getenv("MANYCHAT_FLOW_NS")
    
    if not manychat_key:
        print("ManyChat API Key eksik!")
        return
    
    headers = {
        "Authorization": f"Bearer {manychat_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as http:
        try:
            # Adım 1: Custom Field güncelle (setCustomFieldByName kullan)
            field_response = await http.post(
                "https://api.manychat.com/fb/subscriber/setCustomFieldByName",
                json={
                    "subscriber_id": int(subscriber_id),
                    "field_name": "AI_Response",
                    "field_value": message
                },
                headers=headers
            )
            print(f"[ManyChat] Field güncellendi: {subscriber_id}")
            print(f"[ManyChat] Field Response: {field_response.text}")
            
            # Adım 2: Flow tetikle (eğer flow_ns varsa)
            if flow_ns:
                flow_response = await http.post(
                    "https://api.manychat.com/fb/sending/sendFlow",
                    json={
                        "subscriber_id": int(subscriber_id),
                        "flow_ns": flow_ns
                    },
                    headers=headers
                )
                print(f"[ManyChat] Flow tetiklendi: {subscriber_id}")
                print(f"[ManyChat] Flow Response: {flow_response.text}")
        except Exception as e:
            print(f"ManyChat API Hatası: {e}")


def get_conversation_messages(subscriber_id: str) -> list:
    """Subscriber üçün sohbet geçmişini getir"""
    now = time.time()
    last_time = conversation_timestamps.get(subscriber_id, 0)
    
    # 1 saatdan çox keçibsə, sohbeti sıfırla
    if now - last_time > HISTORY_TTL:
        conversation_history[subscriber_id] = []
    
    conversation_timestamps[subscriber_id] = now
    return conversation_history[subscriber_id]


def add_to_history(subscriber_id: str, role: str, content: str):
    """Mesajı sohbet geçmişinə əlavə et"""
    history = conversation_history[subscriber_id]
    history.append({"role": role, "content": content})
    
    # Max limitdən çox olsa, ən köhnələri sil
    if len(history) > MAX_HISTORY * 2:  # user+assistant = 2 mesaj per turn
        conversation_history[subscriber_id] = history[-(MAX_HISTORY * 2):]


async def process_webhook(subscriber_id: str, user_message: str):
    """
    Webhook işlemi - GPT-4o-mini + Prompt Caching + Conversation History
    """
    global current_system_prompt, client
    
    if not client:
        print("[ERROR] OpenAI client yoxdur! OPENAI_API_KEY env var-ı yoxlayın.")
        return
    
    try:
        # Sohbet geçmişini al
        history = get_conversation_messages(subscriber_id)
        
        # Mesajları hazırla: system + history + yeni mesaj
        messages = [{"role": "system", "content": current_system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # 2.5M token/gün ücretsiz + Prompt Caching
            messages=messages,
            temperature=0.7
        )
        reply = completion.choices[0].message.content or "Üzr istəyirəm, hazırda cavab verə bilmirəm."
        print(f"[OpenAI] Cevap: {reply}")
        
        # Sohbet geçmişinə əlavə et
        add_to_history(subscriber_id, "user", user_message)
        add_to_history(subscriber_id, "assistant", reply)
        print(f"[History] {subscriber_id}: {len(conversation_history[subscriber_id])} mesaj")
        
        # Cache bilgisi
        if hasattr(completion, 'usage') and completion.usage:
            cached = getattr(completion.usage, 'prompt_tokens_details', {})
            if cached:
                print(f"[OpenAI Cache] {cached}")
        
        await send_to_manychat(subscriber_id, reply)
    except Exception as e:
        print(f"İşlem Hatası: {e}")

# --- Startup Event ---
@app.on_event("startup")
def startup_event():
    global current_system_prompt, client
    
    # OpenAI client yoxdursa, startup zamanı yenidən yarat
    if not client:
        key = os.getenv("OPENAI_API_KEY")
        if key:
            client = OpenAI(api_key=key)
            print("OpenAI client startup zamanı yaradıldı.")
        else:
            print("[WARNING] OPENAI_API_KEY hələ təyin olunmayıb!")
    
    # Veritabanı bağlantısını test et
    init_database()
    # Kayıtlı config'i yükle
    config = load_config_sync()
    if config.get("systemPrompt"):
        current_system_prompt = config["systemPrompt"]
        print(f"Kayıtlı sistem promptu yüklendi: {current_system_prompt[:50]}...")

# --- Routes ---
@app.get("/")
def read_root():
    return {"message": "Yüksel Təhsil Mərkəzi - Instagram DM Otomasyonu API Çalışıyor (Python/FastAPI)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/webhook")
async def webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    print(f"Webhook Payload: {payload}")
    background_tasks.add_task(process_webhook, str(payload.id), payload.last_input_text)
    return {"status": "received"}

@app.post("/admin/savePrompt")
def save_prompt(payload: BriefPayload):
    global current_system_prompt
    
    brief = payload.briefData
    print(f"Brief alındı: {brief.businessName}")
    
    # AI ile sistem promptu oluştur
    generated_prompt = generate_prompt_with_ai(brief)
    current_system_prompt = generated_prompt
    
    # Config'i Supabase'e kaydet (brief + prompt)
    config = {
        "briefData": brief.model_dump(),
        "systemPrompt": generated_prompt
    }
    save_config_sync(config)
    
    print(f"Sistem Promptu Güncellendi: {current_system_prompt[:100]}...")
    return {
        "success": True, 
        "message": "Dijital ikiz oluşturuldu",
        "generatedPrompt": generated_prompt
    }

@app.post("/admin/testPrompt")
def test_prompt(payload: TestPayload):
    global current_system_prompt
    if not client:
        raise HTTPException(status_code=503, detail="OpenAI client hazır deyil. OPENAI_API_KEY yoxlayın.")
    try:
        completion = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": current_system_prompt},
                {"role": "user", "content": payload.message}
            ],
            temperature=0.7
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/getConfig")
def get_config():
    """Mevcut config'i getir (brief + prompt)"""
    config = load_config_sync()
    return {
        "briefData": config.get("briefData", {}),
        "hasPrompt": bool(config.get("systemPrompt")),
        "promptPreview": config.get("systemPrompt", "")[:200] + "..." if config.get("systemPrompt") else ""
    }
