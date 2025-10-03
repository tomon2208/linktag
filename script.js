document.addEventListener('DOMContentLoaded', function() {

    // ======== ANIMACJA LICZNIKÓW ========
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // Szybkość animacji

    const animateCounters = () => {
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;

                const inc = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    // ======== ANIMACJE PRZY PRZEWIJANIU (FADE-IN) ========
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) { // Odsłonięcie elementu 100px przed dojechaniem
                el.classList.add('visible');
            }
        });
    };
    
    // Obserwator do uruchomienia liczników tylko raz, gdy są widoczne
    const counterSection = document.querySelector('.counters-section');
    let countersAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                animateCounters();
                countersAnimated = true; // Zapobiega ponownemu uruchomieniu
            }
        });
    }, { threshold: 0.5 }); // Uruchom, gdy 50% sekcji jest widoczne

    if (counterSection) {
        observer.observe(counterSection);
    }

    // Wywołanie funkcji przy przewijaniu i na starcie
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Aby sprawdzić elementy widoczne na starcie

    // ======== HERO: Fade-in i subtelny tilt ========
    const heroImage = document.querySelector('.hero-image');
    const heroWrap = document.querySelector('.hero-image-wrap');
    if (heroImage && heroWrap) {
        // pokaż obraz po załadowaniu
        const imageOnLoad = () => heroImage.classList.add('is-visible');
        if (heroImage.complete) {
            imageOnLoad();
        } else {
            heroImage.addEventListener('load', imageOnLoad, { once: true });
        }

        // tilt na ruch myszy (desktop)
        const maxTilt = 10; // stopnie
        const onMouseMove = (e) => {
            const rect = heroWrap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width; // 0..1
            const y = (e.clientY - rect.top) / rect.height; // 0..1
            const rotateY = (x - 0.5) * (maxTilt * 2);
            const rotateX = (0.5 - y) * (maxTilt * 2);
            heroWrap.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };
        const resetTilt = () => {
            heroWrap.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
        };

        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) {
            heroWrap.addEventListener('mousemove', onMouseMove);
            heroWrap.addEventListener('mouseleave', resetTilt);
        }
    }

    // ======== BANNER: STRONA W BUDOWIE (pokaz jednorazowo na sesję) ========
    try {
        const banner = document.getElementById('siteBanner');
        const closeBtn = document.getElementById('closeBanner');
        const seenKey = 'lt_seen_banner_building_v1';
        const shouldShow = sessionStorage.getItem(seenKey) !== '1';

        if (banner && closeBtn && shouldShow) {
            banner.hidden = false;
            closeBtn.addEventListener('click', () => {
                banner.hidden = true;
                sessionStorage.setItem(seenKey, '1');
            });
        }
    } catch (_) {
        // bezpieczny fallback: nic nie robimy jeśli storage niedostępny
    }

    // ======== FORMULARZ KONTAKTOWY: wysyłka + walidacja + status ========
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const statusEl = document.getElementById('formStatus');
        const submitBtn = document.getElementById('contactSubmit');
        const endpoint = contactForm.getAttribute('data-endpoint'); // np. https://formspree.io/f/xxxx
        const recaptchaSiteKey = contactForm.getAttribute('data-recaptcha-sitekey');

        const setStatus = (message, type = 'info') => {
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.className = '';
            statusEl.classList.add(`status-${type}`);
        };

        const setSubmitting = (isSubmitting) => {
            if (submitBtn) {
                submitBtn.disabled = isSubmitting;
                submitBtn.textContent = isSubmitting ? 'Wysyłanie…' : 'Wyślij Wiadomość';
            }
        };

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // honeypot
            const honey = contactForm.querySelector('#company');
            if (honey && honey.value.trim() !== '') {
                setStatus('Błąd wysyłki. Spróbuj ponownie później.', 'error');
                return;
            }

            const name = contactForm.name?.value?.trim();
            const email = contactForm.email?.value?.trim();
            const message = contactForm.message?.value?.trim();

            if (!name || !email || !message) {
                setStatus('Uzupełnij wszystkie pola.', 'error');
                return;
            }

            // reCAPTCHA v3: pobierz token przed wysyłką (jeśli skonfigurowano site key)
            let recaptchaToken = '';
            if (recaptchaSiteKey && typeof grecaptcha !== 'undefined' && grecaptcha.execute) {
                try {
                    await grecaptcha.ready?.();
                    recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'submit' });
                } catch (_) {
                    // brak tokenu, spróbujemy wysłać i pozwolić backendowi zdecydować
                }
            }

            setSubmitting(true);
            setStatus('Wysyłam…', 'info');

            // Try API endpoint first (if configured)
            if (endpoint) {
                try {
                    const formData = new FormData(contactForm);
                    // usuń honeypot z payloadu
                    formData.delete('company');
                    // zbuduj payload jako FormData (wymagane przez Formspree)
                    const resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' },
                        body: (() => {
                            if (recaptchaToken) {
                                formData.set('g-recaptcha-response', recaptchaToken);
                            }
                            return formData;
                        })()
                    });
                    if (resp.ok) {
                        setStatus('Dziękujemy! Wiadomość została wysłana.', 'success');
                        contactForm.reset();
                        setSubmitting(false);
                        return;
                    } else {
                        // pokaż błąd z Formspree (bez fallbacku do mailto przy odpowiedzi HTTP)
                        try {
                            const data = await resp.json();
                            const err = data?.errors?.[0]?.message || 'Błąd wysyłki. Spróbuj ponownie.';
                            setStatus(err, 'error');
                        } catch (_) {
                            setStatus('Błąd wysyłki. Spróbuj ponownie.', 'error');
                        }
                        setSubmitting(false);
                        return;
                    }
                } catch (_) {
                    // Fallback: mailto tylko przy błędzie sieciowym
                    try {
                        const subject = encodeURIComponent(`Wiadomość ze strony LinkTag od: ${name}`);
                        const body = encodeURIComponent(`Imię i nazwisko: ${name}\nEmail: ${email}\n\nWiadomość:\n${message}`);
                        const mailto = `mailto:kontakt@linktag.pl?subject=${subject}&body=${body}`;
                        window.location.href = mailto;
                        setStatus('Otworzono klienta poczty. Jeśli nie działa, napisz na kontakt@linktag.pl', 'info');
                    } catch (_) {
                        setStatus('Nie udało się wysłać wiadomości. Użyj adresu: kontakt@linktag.pl', 'error');
                    } finally {
                        setSubmitting(false);
                    }
                    return;
                }
            }

            // Brak endpointu: użyj mailto
            try {
                const subject = encodeURIComponent(`Wiadomość ze strony LinkTag od: ${name}`);
                const body = encodeURIComponent(`Imię i nazwisko: ${name}\nEmail: ${email}\n\nWiadomość:\n${message}`);
                const mailto = `mailto:kontakt@linktag.pl?subject=${subject}&body=${body}`;
                window.location.href = mailto;
                setStatus('Otworzono klienta poczty. Jeśli nie działa, napisz na kontakt@linktag.pl', 'info');
            } catch (_) {
                setStatus('Nie udało się wysłać wiadomości. Użyj adresu: kontakt@linktag.pl', 'error');
            } finally {
                setSubmitting(false);
            }
        });
    }

});