
// Homepage navigation functions
function navigateToPasswordLookup() {
  window.location.href = 'password-lookup.html';
}

function navigateToForgetPassword() {
  window.location.href = 'forget-password.html';
}

function navigateToInstallApp() {
  window.location.href = 'https://atharva-9423.github.io/EZsociety';
}

// Add smooth scroll behavior and loading states
document.addEventListener('DOMContentLoaded', function() {
  // Add loading animation to cards
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 200);
  });

  // Add click feedback
  cards.forEach(card => {
    card.addEventListener('click', function() {
      this.style.transform = 'translateY(-8px) rotateX(2deg) scale(0.98)';
      setTimeout(() => {
        this.style.transform = 'translateY(-12px) rotateX(5deg)';
      }, 100);
    });
  });

  // Add keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === '1') navigateToPasswordLookup();
    if (e.key === '2') navigateToForgetPassword();
    if (e.key === '3') navigateToInstallApp();
  });

  console.log('Homepage initialized');
});

// Add particle effect for background (optional enhancement)
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.style.position = 'fixed';
  particlesContainer.style.top = '0';
  particlesContainer.style.left = '0';
  particlesContainer.style.width = '100%';
  particlesContainer.style.height = '100%';
  particlesContainer.style.pointerEvents = 'none';
  particlesContainer.style.zIndex = '-1';
  document.body.appendChild(particlesContainer);

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '2px';
    particle.style.height = '2px';
    particle.style.background = '#58a6ff';
    particle.style.borderRadius = '50%';
    particle.style.opacity = Math.random() * 0.5;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animation = `float ${3 + Math.random() * 4}s ease-in-out infinite`;
    particlesContainer.appendChild(particle);
  }
}

// CSS animation for particles
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
`;
document.head.appendChild(style);

// Initialize particles on load
// createParticles();
