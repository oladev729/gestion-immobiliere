import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const VisitorLogin = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleVisitorLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/visiteurs/login", { 
                email: email.trim(), 
                code_suivi: code.trim() 
            });

            // Stockage des informations
            localStorage.setItem("visitor_email", email.trim());
            localStorage.setItem("visitor_code", code.trim());
            localStorage.setItem("visitor_name", `${response.data.visitor.prenoms} ${response.data.visitor.nom}`);

            navigate("/visitor/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Email ou code de suivi incorrect.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            paddingTop: "60px",
            paddingBottom: "60px",
            textAlign: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
        }}>
            <h4 className="logo-immogest" style={{ fontSize: '2rem', marginBottom: '2rem' }}>ImmoGest</h4>

            <div className="d-flex justify-content-center">
                <div style={{
                    width: "420px",
                    borderRadius: "24px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    padding: "40px",
                    textAlign: "left"
                }}>
                    <h3 style={{ color: "#1e293b", fontWeight: "800", marginBottom: "8px" }}>Accès Visiteur</h3>
                    <p className="small text-muted mb-4">
                        Entrez votre email et votre code de suivi (ex: VG-1234) pour accéder à votre espace.
                    </p>

                    {error && (
                        <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '10px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVisitorLogin}>
                        <div className="mb-3">
                            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Adresse email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                style={{ borderRadius: '12px', padding: '12px' }}
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="exemple@email.com" 
                                required 
                            />
                        </div>

                        <div className="mb-4">
                            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Code de suivi</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                style={{ borderRadius: '12px', padding: '12px' }}
                                value={code} 
                                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                                placeholder="VG-XXXX" 
                                required 
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 py-3 mb-3 fw-bold"
                            style={{ borderRadius: "12px", boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}
                            disabled={loading}
                        >
                            {loading ? "Vérification..." : "Accéder à mes demandes"}
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <Link to="/login" className="text-decoration-none small text-muted">
                            Retour à la connexion standard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorLogin;
