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

});