import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuth2Redirect() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            login(token); // localStorage’a kaydet ve login ol
            navigate("/"); // anasayfaya yönlendir
        } else {
            navigate("/login");
        }
    }, []);

    return <p>Giriş yapılıyor...</p>;
}
