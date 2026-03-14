(function () {
  const AUTH_TOKEN_KEY = "concordia_token";

  function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  function setToken(token) {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "index.html";
    window.location.href = next;
  }

  // Login form
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  if (loginForm && loginMessage) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      loginMessage.textContent = "";
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          loginMessage.textContent = data.error || "Something went wrong. Try again.";
          return;
        }
        setToken(data.token);
        redirectAfterLogin();
      } catch (err) {
        loginMessage.textContent = "Something went wrong. Please try again.";
      }
    });
  }

  // Signup form
  const signupForm = document.getElementById("signup-form");
  const signupMessage = document.getElementById("signup-auth-message");
  if (signupForm && signupMessage) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      signupMessage.textContent = "";
      const name = signupForm.querySelector('[name="name"]').value;
      const email = signupForm.querySelector('[name="email"]').value;
      const password = signupForm.querySelector('[name="password"]').value;
      const confirmPassword = signupForm.querySelector('[name="confirmPassword"]').value;

      if (password !== confirmPassword) {
        signupMessage.textContent = "Passwords do not match.";
        return;
      }
      if (password.length < 6) {
        signupMessage.textContent = "Password must be at least 6 characters.";
        return;
      }

      const emailLower = email.trim().toLowerCase();
      const allowed =
        emailLower.endsWith("@student.uaustin.org") || emailLower.endsWith("@uaustin.org");
      if (!allowed) {
        signupMessage.textContent = "Please use your school email to sign up.";
        return;
      }

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          signupMessage.textContent = data.error || "Something went wrong. Try again.";
          return;
        }
        setToken(data.token);
        redirectAfterLogin();
      } catch (err) {
        signupMessage.textContent = "Something went wrong. Please try again.";
      }
    });
  }
})();
