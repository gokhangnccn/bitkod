import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import { toast } from "sonner";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("LOADING");

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("ERROR");
            return;
        }

        api.get(`/auth/confirm?token=${token}`)
            .then(() => {
                toast.success("Hesabınız doğrulandı. Giriş yapabilirsiniz.");
                setStatus("SUCCESS");
                setTimeout(() => navigate("/login"), 3000);
            })
            .catch(() => {
                setStatus("ERROR");
            });
    }, [searchParams, navigate]);

    if (status === "LOADING") return <p>Doğrulama yapılıyor...</p>;
    if (status === "SUCCESS") return <p>Doğrulama başarılı! Yönlendiriliyorsunuz...</p>;
    return <p>Doğrulama başarısız veya süresi dolmuş.</p>;
}
