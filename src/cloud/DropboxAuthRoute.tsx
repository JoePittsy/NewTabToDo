import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DropboxBackupService } from "./DropboxBackupService";

/**
 * DropboxAuthRoute
 * Handles Dropbox OAuth 2.0 redirect URIs.
 * Dropbox will redirect here with `code` and `state` query params after user authorization.
 *
 * NOTE: In a production setup you should exchange the auth code for an access token on a server,
 * since it requires your app secret, which should never be exposed to the client.
 */
const DropboxAuthRoute: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("Authorizing with Dropbox...");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            setMessage("Dropbox authorization failed: " + error);
            return;
        }

        if (code) {
            // Step 3: exchange authorization code for token using PKCE
            const storedVerifier = localStorage.getItem("dropbox_code_verifier");
            if (!storedVerifier) {
                setMessage("Missing PKCE code verifier. Cannot complete Dropbox auth.");
                return;
            }

            const clientId = "yj55ji2tb6o3bx2";
            const redirectUri = window.location.origin + "/dropbox_auth";

            (async () => {
                const tokenResp = await fetch("https://api.dropboxapi.com/oauth2/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        code,
                        grant_type: "authorization_code",
                        client_id: clientId,
                        redirect_uri: redirectUri,
                        code_verifier: storedVerifier,
                    }),
                });

                if (!tokenResp.ok) {
                    setMessage("Dropbox auth failed: " + (await tokenResp.text()));
                    return;
                }
                const tokenData = await tokenResp.json();
                const accessToken = tokenData.access_token;
                if (accessToken) {
                    localStorage.setItem("dropboxAccessToken", accessToken);
                    setMessage("Select a backup to restore...");
                    try {
                        const svc = new DropboxBackupService();
                        await svc.authenticate();
                        setLoading(true);
                        const files = await svc.listBackups();
                        setLoading(false);
                        navigate("/");
                    } catch (err: any) {
                        setMessage("Could not fetch backup list: " + err.message);
                    }
                } else {
                    setMessage("Dropbox did not return a valid access token.");
                }
            })();
        } else {
            setMessage("No authorization code found in URL.");
        }
    }, [searchParams]);

    return (
        <div className="p-8 text-center">
            <h2>Dropbox Authentication</h2>
            <p>{message}</p>
        </div>
    );
};

export default DropboxAuthRoute;
