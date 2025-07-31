# 🚀 Bitkod

**Bitkod**, yazılım geliştiricilerin ve öğrencilerin algoritma problemleri üzerinde pratik yapmalarına olanak tanıyan modern ve kapsamlı bir platformdur. Kullanıcılar, çözümlerini paylaşabilir, yapay zeka destekli (LLM) geri bildirimler alabilir ve ilerlemelerini takip edebilir.

Platform, Google Cloud Kubernetes Engine (GKE) üzerinde çalışan, güvenli ve izole kod yürütme ortamları sunan bir backend ile React tabanlı kullanıcı dostu bir frontend arayüzünden oluşmaktadır.

---

## 🌐 Erişim Adresleri

| Bileşen         | Adres                                 |
|-----------------|----------------------------------------|
| Ana Platform    | [bitkod.org](https://www.bitkod.org)   |
| Yönetim Paneli  | [admin.bitkod.org](https://admin.bitkod.org) |
| API             | [api.bitkod.org](https://api.bitkod.org)     |

---

## 📑 İçindekiler

- [🎯 Hakkında](#-hakkında)
- [✨ Temel Özellikler](#-temel-özellikler)
- [🛠️ Teknoloji Yığını](#-teknoloji-yığını)
- [🏗️ Mimari Genel Bakış](#-mimari-genel-bakış)
- [📁 Proje Yapısı](#-proje-yapısı)
- [🚀 Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [⚙️ API](#-api)
- [🧪 Testler](#-testler)
- [🤝 Katkıda Bulunma](#-katkıda-bulunma)
- [📄 Lisans](#-lisans)
- [📧 İletişim](#-iletişim)

---

## 🎯 Hakkında

Bitkod, aşağıdaki temel sorunlara çözüm sunmak üzere tasarlanmıştır:

- 🚫 Güvenli ve izole kod çalıştırma altyapısının eksikliği  
- ⚠️ Kod çözümlerine yönelik hızlı ve yapıcı geri bildirim eksikliği  
- 🔍 Modern, kullanıcı dostu ve üretkenliğe yönelik bir algoritma pratik platformu ihtiyacı  

Bitkod bu ihtiyaçlara şu çözümleri sunar:

- GKE üzerinde dinamik olarak oluşturulan Kubernetes Job'ları ile izole kod yürütme  
- LLM isteklerinin Redis tabanlı kuyruk sistemi üzerinden asenkron işlenmesi  
- React tabanlı kullanıcı arayüzü ve yönetim paneli  
- E-posta doğrulama, şifre sıfırlama ve OAuth2 ile giriş gibi kullanıcı yönetimi özellikleri  

---

## ✨ Temel Özellikler

- 👤 **Kullanıcı Yönetimi:** Kayıt, giriş (Google OAuth2 destekli), e-posta doğrulama, şifre sıfırlama  
- 🧩 **Problem Çözümü:** Farklı zorluk seviyelerinde algoritma problemleri, çözüm gönderimi  
- 🛡️ **Güvenli Kod Yürütme:** Java ve Python çözümleri GKE üzerinde izole ortamda çalıştırılır  
- 🧠 **LLM Geri Bildirimleri:** Yapay zeka destekli çözüm değerlendirme ve öneriler  
- 📡 **WebSocket Bildirimleri:** Anlık geri bildirim ve kod çalıştırma sonuçları  
- 📊 **Yönetim Paneli:** Kullanıcı, problem ve çözüm yönetimi + sistem istatistikleri  
- 🏆 **Liderlik Tablosu:** Başarı puanlarına göre sıralama  
- 🔗 **RESTful API:** Frontend ve diğer istemcilerle iletişim için  
- 🎨 **Tema Desteği:** Açık/koyu mod  
- 🚩 **Problem Raporlama:** Kullanıcıdan gelen hata/sorun bildirimleri  

---

## 🛠️ Teknoloji Yığını

### Backend (`/src`)

- **Dil / Çerçeve:** Java 21, Spring Boot 3.x
- **Modüller:** Web, WebFlux, JPA, Security, OAuth2 Client, WebSocket, Redis, Actuator
- **Veritabanları:**
  - PostgreSQL (ana veri deposu)
  - Redis (cache, session, LLM kuyruğu)
- **Güvenlik:** Spring Security, JWT
- **LLM:** Harici LLM API entegrasyonu (konfigürasyonla değiştirilebilir)
- **Kubernetes:** `fabric8` client ile dinamik Job yönetimi
- **E-posta:** Gmail Workspace, Spring Boot Mail
- **Diğer:** Lombok, MapStruct

### Frontend (`/frontend`)

- **Framework:** React (Vite + TypeScript)
- **Stil:** TailwindCSS, lucide-react, sonner
- **Yönlendirme:** React Router DOM
- **Durum Yönetimi:** React Context API, özel hook'lar
- **Formlar:** React Hook Form + Zod
- **API:** Axios, SockJS, StompJS
- **Kod Editörü:** Monaco Editor (veya benzeri)
- **Grafikler:** Recharts (veya Chart.js)
- **Lint / Format:** ESLint, Prettier

---

## 🏗️ Mimari Genel Bakış

- **Frontend:** React + Nginx (Docker imajı içinde)
- **Backend:** Spring Boot uygulaması (REST API + WebSocket + Security)
- **Runner:** GKE üzerinde çalışan Java/Python kod yürüten Kubernetes Job’ları
- **LLM Kuyruğu:** Redis üzerinden asenkron işleme
- **Veri:** PostgreSQL & Redis
- **Dağıtım:** GKE + Docker + Kubernetes manifest dosyaları

---

## 📁 Proje Yapısı

bitkod/
├── frontend/ # React frontend
├── src/ # Spring Boot backend
├── docker/
│ ├── code-runner/ # Java kod çalıştırıcı Dockerfile
│ └── python-runner/ # Python kod çalıştırıcı Dockerfile
├── k8s/ # Kubernetes manifest dosyaları
├── docker-compose.yml # Yerel geliştirme ortamı
└── README.md

---

## 🚀 Kurulum ve Çalıştırma

### ✅ Ön Koşullar

- Docker & Docker Compose
- Node.js & npm
- Java 21
- PostgreSQL & Redis
- Google Cloud SDK (GKE için)

### 🔧 Backend Kurulumu

cd src
./gradlew build

### 💻 Frontend Kurulumu

cd frontend
npm install
npm run dev

### 🧪 Runner İmajları
docker build -t java-runner:latest ./docker/code-runner
docker build -t python-runner:latest ./docker/python-runner

### 🧩 Docker Compose (Yerel)
docker-compose up

### ☁️ Kubernetes (GKE)
kubectl apply -f k8s/

### ⚙️ API
Tüm RESTful endpointler Swagger/OpenAPI dokümantasyonu ile erişilebilir. Detaylar için https://api.bitkod.org adresini ziyaret edebilirsiniz.

### 🧪 Testler
Backend: JUnit 5, Mockito, Spring Boot Test, Reactor Test, Spring Security Test

Frontend: (Planlama aşamasında) Jest + React Testing Library önerilir

### 🤝 Katkıda Bulunma
Katkılarınızı memnuniyetle karşılıyoruz! PR göndererek ya da sorun bildirerek destek olabilirsiniz. Daha fazla bilgi için CONTRIBUTING.md dosyasına göz atın.

### 📄 Lisans
Bu proje MIT Lisansı ile lisanslanmıştır. Ayrıntılar için LICENSE dosyasını inceleyebilirsiniz.

### 📧 İletişim
Her türlü öneri, hata bildirimi ya da katkı için bizimle iletişime geçin:
📬 gokhangnccn@gmail.com

---
