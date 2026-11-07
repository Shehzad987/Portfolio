
(function () {
    "use strict";

    const PRODUCTION_API_URL = "https://my-portfolio-backend-l7d8.onrender.com";
    const LOCAL_API_URL = "http://localhost:5000";
    const FALLBACK_EMAIL = "shehzadadnan007@gmail.com";

    const isLocal = ["localhost", "127.0.0.1"].includes(
        window.location.hostname
    );

    const API_URL = `${
        isLocal ? LOCAL_API_URL : PRODUCTION_API_URL
    }/api/contact`;

    const form = document.getElementById("contact-form");
    const statusBox = document.getElementById("form-status");

    if (!form || !statusBox) {
        console.error("Contact form or status element not found.");
        return;
    }

    const submitButton = form.querySelector('[type="submit"]');

    function showStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className = `form-status ${type}`;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(form));

        submitButton.disabled = true;
        showStatus("Sending your message...", "info");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Something went wrong."
                );
            }

            showStatus(
                result.message || "Your message has been sent successfully!",
                "success"
            );

            form.reset();

        } catch (error) {
            console.error("Contact form error:", error);

            showStatus(
                isLocal
                    ? `Cannot connect to the local backend. Start it with npm run dev.`
                    : `Sorry, your message could not be sent. Please email ${FALLBACK_EMAIL}.`,
                "error"
            );

        } finally {
            submitButton.disabled = false;
        }
    });
})();
