BİTKOD 🚀

BİTKOD, kullanıcıların algoritma problemlerini çözebileceği, çözümlerini paylaşabileceği ve LLM destekli geri bildirimler alabileceği modern bir web uygulamasıdır. Platform, Google Cloud Kubernetes Engine (GKE) üzerinde çalışan, güvenli ve izole kod çalıştırma ortamları sunan bir backend ile React tabanlı kullanıcı dostu bir arayüze sahiptir.

Erişim Adresleri:

Ana Platform: https://www.bitkod.org (Varsayılan)

Yönetim Paneli: https://admin.bitkod.org (Varsayılan)

API: https://api.bitkod.org (Varsayılan)

📑 İçindekiler
🎯 Hakkında

✨ Temel Özellikler

🛠️ Teknoloji Yığını

🏗️ Mimari Genel Bakış

📁 Proje Yapısı

🚀 Kurulum ve Çalıştırma

Ön Koşullar

Backend Kurulumu

Frontend Kurulumu

Runner İmajları Oluşturma

Docker Compose ile Yerel Çalıştırma

Kubernetes (GKE) Dağıtımı

⚙️ API

🧪 Testler

🤝 Katkıda Bulunma

📄 Lisans

📧 İletişim

🎯 Hakkında
Bitkod, yazılım geliştiricilerin ve öğrencilerin algoritma çözme becerilerini geliştirmelerine yardımcı olmak amacıyla tasarlanmış kapsamlı bir platformdur. Temel motivasyonu, kullanıcılara güvenli, izole ve modern bir ortamda pratik yapma imkanı sunarken, aynı zamanda gönderdikleri çözümler hakkında yapay zeka destekli (LLM) derinlemesine geri bildirimler sağlamaktır.

Proje, aşağıdaki temel problemleri çözmeyi hedefler:

Güvenli ve izole kod çalıştırma ortamlarının eksikliği.

Kullanıcı çözümlerine yönelik anlık ve yapıcı geri bildirimlerin yetersizliği.

Modern teknolojilerle geliştirilmiş, kullanıcı dostu ve kapsamlı bir pratik platformu ihtiyacı.

Bitkod, bu problemlere Google Cloud Kubernetes Engine (GKE) üzerinde dinamik olarak oluşturulan Kubernetes Job'ları ile (Java ve Python için ayrı runner imajları kullanarak) izole kod çalıştırma, LLM isteklerinin Redis tabanlı bir kuyruk sistemi üzerinden asenkron yönetimi ve kapsamlı bir yönetim paneli gibi yenilikçi çözümler sunar. Ayrıca, e-posta ile hesap doğrulama ve şifre sıfırlama gibi temel kullanıcı yönetimi işlevlerini de içerir.

✨ Temel Özellikler
👤 Kullanıcı Yönetimi: Kayıt olma, e-posta ile hesap doğrulama, giriş yapma (Google OAuth2 ile de), şifre sıfırlama, profil yönetimi.

🧩 Problem Listeleme ve Çözme: Çeşitli zorluk seviyelerinde algoritmik problemleri listeleme, detaylarını görüntüleme ve çözüm gönderme.

🛡️ Güvenli ve İzole Kod Çalıştırma: Java ve Python dillerinde gönderilen kodların, GKE üzerinde dinamik olarak oluşturulan ve özel Docker imajları kullanan Kubernetes Job'ları ile güvenli ve izole bir şekilde çalıştırılması.

🧠 LLM Destekli Geri Bildirim: Gönderilen kod çözümleri için yapay zeka modeli (LLM) aracılığıyla kod incelemesi, yeniden düzenleme önerileri ve kalite değerlendirmesi gibi geri bildirimlerin Redis kuyruk sistemi üzerinden asenkron olarak sağlanması.

📡 Anlık Bildirimler: Kod çalıştırma sonuçları ve LLM geri bildirimleri gibi önemli güncellemelerin WebSocket aracılığıyla kullanıcılara anlık olarak iletilmesi.

📊 Yönetim Paneli (admin.bitkod.org): Kullanıcıları, problemleri, gönderilen çözümleri ve raporları yönetmek için ayrı bir arayüz. Sistem istatistiklerini görüntüleme.

🏆 Liderlik Tablosu: Kullanıcıların başarılarına göre sıralandığı bir liderlik tablosu.

🔗 API (api.bitkod.org): Frontend ve potansiyel diğer istemciler için RESTful API.

🎨 Tema Desteği: Açık ve koyu tema seçenekleri.

🚩 Problem Raporlama: Kullanıcıların problemlerdeki hataları veya sorunları raporlayabilmesi.

🛠️ Teknoloji Yığını
Backend (src/)
Dil & Çerçeve: Java 21, Spring Boot 3.x (Web, Data JPA, Security, WebSocket, OAuth2 Client, Mail, Data Redis, Actuator, WebFlux)

Build Aracı: Gradle (build.gradle.kts) 

Veritabanları:

PostgreSQL  (Ana veri deposu)

Redis  (Önbellekleme, oturum yönetimi, LLM istek kuyruğu)

Güvenlik: Spring Security, JWT (JSON Web Tokens)

LLM Entegrasyonu: Belirli bir LLM API'si ile entegrasyon (application.properties üzerinden yapılandırılır)

Kubernetes İstemcisi: io.fabric8:kubernetes-client (Dinamik Job yönetimi için)

E-posta: Spring Boot Mail, Workspace Gmail (Hesap doğrulama, şifre sıfırlama)

Diğer: Lombok, MapStruct

Frontend (frontend/)
Kütüphane & Araçlar: React, Vite, TypeScript

Stil: TailwindCSS , lucide-react (ikonlar), sonner (bildirimler)

Yönlendirme: React Router DOM

Durum Yönetimi: React Context API, Özel Hook'lar (useDebounce, useWebSocket)

API İletişimi: Axios, SockJS-Client, StompJS

Form Yönetimi: React Hook Form, Zod (doğrulama)

Kod Editörü: Monaco Editor (veya benzeri, EnhancedCodeEditor.tsx ile) 

Grafikler: Recharts (veya Chart.js, UserCharts.tsx ile)

Linting & Formatlama: ESLint, Prettier

DevOps & Altyapı
Konteynerizasyon: Docker 

Dockerfile (Backend uygulaması için)

frontend/Dockerfile (Frontend uygulamasını Nginx ile sunmak için)

docker/code-runner/Dockerfile (Java kod çalıştırma ortamı)

docker/python-runner/Dockerfile (Python kod çalıştırma ortamı)

Orkestrasyon: Kubernetes (Google Kubernetes Engine - GKE)  

Manifestler k8s/ dizininde (Deployment, Service, Job, Ingress, ManagedCertificate vb.)

Yerel Geliştirme: Docker Compose (docker-compose.yml ile Redis ve runner servisleri)

Web Sunucusu (Frontend için): Nginx (Frontend Docker imajı içinde) 

Test
Backend: JUnit 5, Mockito, Spring Boot Test, Reactor Test, Spring Security
