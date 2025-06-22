document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".oe_login_form");
    if (form) {
        form.addEventListener("submit", function () {
            console.log("Store kye");
            const passwordInput = form.querySelector("input[name='password']");
            sessionStorage.setItem("master_key", passwordInput.value)
        });
    }
});