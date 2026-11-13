// ==========================================================================
// COMPONENTE: CARROSSEL INFORMATIVO
// ==========================================================================

function initInformativoCarousel() {
    let currentSlide = 0;
    const carouselContainer = document.getElementById('carouselContainer');
    const dots = document.querySelectorAll('.dot');

    if (!carouselContainer) return;

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            currentSlide = parseInt(e.target.getAttribute('data-slide'));
            atualizarSlide();
        });
    });

    function atualizarSlide() {
        carouselContainer.style.transform = `translateX(-${currentSlide * 33.333}%)`;
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlide);
        });
    }

    setInterval(() => {
        currentSlide = (currentSlide + 1) % 3;
        atualizarSlide();
    }, 10000);
}
window.initInformativoCarousel = initInformativoCarousel;