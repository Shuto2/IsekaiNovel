document.addEventListener('DOMContentLoaded', () => {
  const titlePage = document.getElementById('title-page');

  if (titlePage) {
    titlePage.addEventListener('click', () => {
      window.location.href = 'top.html';
    });
  }
});