function showMenu() {
    const sidebar = document.getElementById("side-bare");
    const header = document.getElementById("header");
    sidebar?.classList.add("show");
    header?.classList.add("hide");
}
function closeMenu() {
    const sidebar = document.getElementById("side-bare");
    const header = document.getElementById("header");
    sidebar?.classList.remove("show");
    header?.classList.remove("hide");
}

function hideHeader() {
    document.getElementById("header")?.classList.toggle("hide");
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});
