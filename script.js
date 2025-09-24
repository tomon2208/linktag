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

});
