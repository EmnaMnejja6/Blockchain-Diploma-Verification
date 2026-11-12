import { BrowserProvider, Contract } from "ethers";
import universityAbi from "./abi/UniversityRegistry.json";
import { CONTRACT_ADDRESS, CHAIN_ID } from "./config.js";

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const userDropdown = document.getElementById("userDropdown");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

// Modal elements (only on pages with modal)
const closeModal = loginModal && document.querySelector(".close");
const adminLoginBtn = loginModal && document.getElementById("adminLoginBtn");
const universityLoginBtn = loginModal && document.getElementById("universityLoginBtn");
const loginStatus = loginModal && document.getElementById("loginStatus");

// Check authentication on page load
checkAuth();

// Dropdown toggle functionality
if (userDropdown) {
    const userIconBtn = userDropdown.querySelector(".user-icon-btn");
    const dropdownMenu = userDropdown.querySelector(".dropdown-menu");
    
    userIconBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });
    
    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
        dropdownMenu.classList.remove("show");
    });
    
    // Prevent closing when clicking inside dropdown
    dropdownMenu.addEventListener("click", (e) => {
        e.stopPropagation();
    });
}

// Open modal when login button is clicked (only on public pages)
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        loginModal.hidden = false;
        if (loginStatus) {
            loginStatus.textContent = "";
            loginStatus.style.color = "black";
        }
    });
}

// Close modal when X is clicked
if (closeModal) {
    closeModal.addEventListener("click", () => {
        loginModal.hidden = true;
    });
}

// Close modal when clicking outside
if (loginModal) {
    window.addEventListener("click", (event) => {
        if (event.target === loginModal) {
            loginModal.hidden = true;
        }
    });
}

// Admin login
if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", async () => {
        await handleLogin("admin");
    });
}

// University login
if (universityLoginBtn) {
    universityLoginBtn.addEventListener("click", async () => {
        await handleLogin("university");
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        logout();
    });
}

// Check if user is authenticated and update UI
function checkAuth() {
    const currentPage = window.location.pathname;
    const storedAccount = sessionStorage.getItem("connectedAccount");
    const userRole = sessionStorage.getItem("userRole");
    const storedName = sessionStorage.getItem("userName");
    const timestamp = sessionStorage.getItem("connectionTimestamp");

    // Check if session is valid (within 30 minutes)
    const isValidSession = storedAccount && userRole && timestamp &&
        (Date.now() - parseInt(timestamp)) < 30 * 60 * 1000;

    if (isValidSession) {
        // User is authenticated
        if (loginBtn) loginBtn.hidden = true;
        if (userDropdown) {
            userDropdown.hidden = false;
            userName.textContent = storedName || storedAccount.substring(0, 8) + "...";
            
            // Set dashboard link based on role
            const dashboardLink = document.getElementById("dashboardLink");
            const dashboardText = document.getElementById("dashboardText");
            if (dashboardLink && dashboardText) {
                if (userRole === "admin") {
                    dashboardLink.href = "/admin.html";
                    dashboardText.textContent = "Administration";
                } else if (userRole === "university") {
                    dashboardLink.href = "/issue.html";
                    dashboardText.textContent = "Émission";
                }
            }
        }

        // Protected page access control
        if (currentPage.includes("/admin.html") && userRole !== "admin") {
            window.location.href = "/index.html";
            return;
        } else if (currentPage.includes("/issue.html") && userRole !== "university") {
            window.location.href = "/index.html";
            return;
        }
    } else {
        // User is not authenticated
        if (loginBtn) loginBtn.hidden = false;
        if (userDropdown) userDropdown.hidden = true;

        // Redirect from protected pages
        if (currentPage.includes("/admin.html") || currentPage.includes("/issue.html")) {
            window.location.href = "/index.html";
            return;
        }
    }
}

// Store connection info in sessionStorage before redirect
function storeConnectionAndRedirect(account, role, name, redirectUrl) {
    sessionStorage.setItem("connectedAccount", account);
    sessionStorage.setItem("userRole", role);
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("connectionTimestamp", Date.now().toString());
    window.location.href = redirectUrl;
}

// Handle login based on role
async function handleLogin(expectedRole) {
    if (!window.ethereum) {
        loginStatus.textContent = "MetaMask n'est pas installé. Veuillez l'installer pour continuer.";
        loginStatus.style.color = "red";
        return;
    }

    try {
        loginStatus.textContent = "Connexion en cours...";
        loginStatus.style.color = "black";

        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== CHAIN_ID) {
            loginStatus.textContent = "Mauvais réseau : veuillez vous connecter au réseau Hardhat (31337)";
            loginStatus.style.color = "red";
            return;
        }

        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        // Check role
        const contract = new Contract(CONTRACT_ADDRESS, universityAbi, provider);
        const admin = await contract.admin();

        if (expectedRole === "admin") {
            // User clicked admin button
            if (admin.toLowerCase() === account.toLowerCase()) {
                loginStatus.textContent = "Administrateur vérifié. Redirection...";
                loginStatus.style.color = "green";
                storeConnectionAndRedirect(account, "admin", "Administrateur", "/admin.html");
            } else {
                loginStatus.textContent = "Ce compte n'est pas administrateur.";
                loginStatus.style.color = "red";
            }
        } else {
            // User clicked university button
            if (admin.toLowerCase() === account.toLowerCase()) {
                loginStatus.textContent = "Ce compte est administrateur, pas une université. Utilisez le bouton Administrateur.";
                loginStatus.style.color = "red";
                return;
            }

            try {
                const universityName = await contract.getUniversityName(account);
                const [wallet, active] = await contract.getUniversityAddress(universityName);
                
                if (active) {
                    loginStatus.textContent = `Université vérifiée: ${universityName}. Redirection...`;
                    loginStatus.style.color = "green";
                    storeConnectionAndRedirect(account, "university", universityName, "/issue.html");
                } else {
                    loginStatus.textContent = "Votre université a été révoquée. Contactez l'administrateur.";
                    loginStatus.style.color = "red";
                }
            } catch (err) {
                loginStatus.textContent = "Ce compte n'appartient à aucune université enregistrée.";
                loginStatus.style.color = "red";
            }
        }
    } catch (err) {
        console.error(err);
        if (err.code === 4001) {
            loginStatus.textContent = "Connexion annulée par l'utilisateur.";
        } else {
            loginStatus.textContent = "Erreur de connexion : " + (err.message || "Erreur inconnue");
        }
        loginStatus.style.color = "red";
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem("connectedAccount");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("connectionTimestamp");
    window.location.href = "/index.html";
}

// Export for use in other modules
export { checkAuth, logout };
