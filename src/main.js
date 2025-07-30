// Импорт необходимых модулей Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Ваша конфигурация Firebase (скопирована из консоли Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyCbURdt8yortvbEj0xk9TewamqtWGC04VY",
  authDomain: "luminixis-nft-site.firebaseapp.com",
  projectId: "luminixis-nft-site",
  storageBucket: "luminixis-nft-site.appspot.com",
  messagingSenderId: "219818755332",
  appId: "1:219818755332:web:10c9f3c8c58dc8de417c51"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Логика Аутентификации и Отображения UI ---
document.addEventListener('DOMContentLoaded', () => {
    // Элементы UI для десктопа
    const loginButtonDesktop = document.getElementById('login-button-desktop');
    const logoutButtonDesktop = document.getElementById('logout-button-desktop');
    const authStatusDesktop = document.getElementById('auth-status-desktop');
    const userEmailDisplayDesktop = document.getElementById('user-email-display-desktop');

    // Элементы UI для мобильного меню
    const mobileMenuButton = document.getElementById('menu-btn'); // Кнопка гамбургера
    const mobileMenuLinks = document.getElementById('mobile-menu'); // Контейнер мобильного меню
    const closeMobileMenuBtn = document.getElementById('close-mobile-menu-btn'); // Кнопка закрытия мобильного меню
    const loginButtonMobile = document.getElementById('login-button-mobile');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const authStatusMobile = document.getElementById('auth-status-mobile');
    const userEmailDisplayMobile = document.getElementById('user-email-display-mobile');

    // Элементы модального окна аутентификации
    const authModal = document.getElementById('auth-modal');
    const closeModalButton = document.getElementById('close-modal');
    const authForm = document.getElementById('auth-form');
    const authToggle = document.getElementById('auth-toggle');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Секция для добавления продукта
    const addProductSection = document.getElementById('add-product-section');
    const addProductForm = document.getElementById('add-product-form');
    const productNameInput = document.getElementById('product-name');
    const productDescriptionInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');

    let isLoginMode = true; // true = Login, false = Register

    // --- Мобильное меню ---
    function toggleMobileMenu() {
        mobileMenuLinks.classList.toggle('is-open');
    }
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    closeMobileMenuBtn.addEventListener('click', toggleMobileMenu); // Закрытие по крестику

    // Закрываем мобильное меню при клике на ссылку
    mobileMenuLinks.querySelectorAll('a.menu-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuLinks.classList.remove('is-open');
        });
    });

    // --- Модальное окно аутентификации ---
    const openAuthModal = () => {
        authModal.classList.remove('hidden');
        errorMessage.textContent = '';
        emailInput.value = ''; // Очищаем поля
        passwordInput.value = '';
    };

    loginButtonDesktop.addEventListener('click', openAuthModal);
    loginButtonMobile.addEventListener('click', openAuthModal); // Кнопка в мобильном меню

    closeModalButton.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    // Переключение между режимами "Вход" и "Регистрация"
    authToggle.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authToggle.textContent = isLoginMode ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти";
        authForm.querySelector('button[type="submit"]').textContent = isLoginMode ? "Войти" : "Зарегистрироваться";
        errorMessage.textContent = '';
    });

    // Обработка отправки формы аутентификации
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.textContent = '';

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            authModal.classList.add('hidden');
        } catch (error) {
            console.error("Ошибка аутентификации:", error.message);
            let userMessage = "Произошла неизвестная ошибка.";
            if (error.code === 'auth/invalid-email') {
                userMessage = "Неверный формат email.";
            } else if (error.code === 'auth/user-disabled') {
                userMessage = "Аккаунт заблокирован.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                userMessage = "Неверный email или пароль.";
            } else if (error.code === 'auth/email-already-in-use') {
                userMessage = "Этот email уже используется.";
            } else if (error.code === 'auth/weak-password') {
                userMessage = "Пароль слишком слабый (минимум 6 символов).";
            }
            errorMessage.textContent = userMessage;
        }
    });

    // Отслеживание состояния аутентификации
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Пользователь вошел в систему
            authStatusDesktop.classList.remove('hidden');
            loginButtonDesktop.classList.add('hidden');
            logoutButtonDesktop.classList.remove('hidden');
            userEmailDisplayDesktop.textContent = user.email;

            authStatusMobile.classList.remove('hidden');
            loginButtonMobile.classList.add('hidden');
            logoutButtonMobile.classList.remove('hidden');
            userEmailDisplayMobile.textContent = user.email;

            addProductSection.classList.remove('hidden'); // Показать секцию добавления продукта
            loadProducts(); // Перезагрузить продукты, чтобы обновить лайки/комментарии
        } else {
            // Пользователь вышел из системы
            authStatusDesktop.classList.add('hidden');
            loginButtonDesktop.classList.remove('hidden');
            logoutButtonDesktop.classList.add('hidden');
            userEmailDisplayDesktop.textContent = '';

            authStatusMobile.classList.add('hidden');
            loginButtonMobile.classList.remove('hidden');
            logoutButtonMobile.classList.add('hidden');
            userEmailDisplayMobile.textContent = '';

            addProductSection.classList.add('hidden'); // Скрыть секцию добавления продукта
            loadProducts(); // Перезагрузить продукты
        }
    });

    // Выход из системы
    logoutButtonDesktop.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Ошибка выхода:", error.message);
        }
    });
    logoutButtonMobile.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Ошибка выхода:", error.message);
        }
    });

    // --- Логика продуктов (загрузка, добавление, лайки, комментарии) ---
    const productsContainer = document.getElementById('products-container');

    // Загрузка продуктов из Firestore в реальном времени
    const productsCollectionRef = collection(db, "products");
    const q = query(productsCollectionRef, orderBy("createdAt", "desc")); // Сортировка по дате создания

    onSnapshot(q, (snapshot) => {
        productsContainer.innerHTML = ''; // Очищаем контейнер перед загрузкой
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (productsList.length === 0) {
            productsContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Пока нет продуктов. Добавьте первый!</p>';
        } else {
            productsList.forEach(product => {
                const productCard = createProductCard(product);
                productsContainer.appendChild(productCard);
            });
        }
    }, (error) => {
        console.error("Ошибка при получении продуктов в реальном времени:", error);
        productsContainer.innerHTML = '<p class="text-center text-red-400 col-span-full">Ошибка загрузки продуктов. Попробуйте обновить страницу.</p>';
    });

    // Создание карточки продукта
    function createProductCard(product) {
        const user = auth.currentUser;
        const liked = user && product.likes && product.likes.includes(user.uid);
        const likesCount = product.likes ? product.likes.length : 0;
        const commentsCount = product.comments ? product.comments.length : 0;

        const card = document.createElement('div');
        card.className = 'nft-card rounded-xl shadow-lg overflow-hidden p-6'; // Добавлен padding прямо в карточку
        card.innerHTML = `
            <img src="${product.imageUrl || 'https://placehold.co/600x600/1e293b/e2e8f0?text=No+Image'}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg mb-4">
            <h3 class="text-2xl font-semibold mb-2 text-white">${product.name}</h3>
            <p class="text-gray-400 text-sm mb-4">${product.description}</p>
            <div class="flex justify-between items-center mb-4">
                <span class="text-xl font-bold text-blue-400">${product.price}</span>
                <button class="btn-primary">Купить NFT</button>
            </div>
            <div class="flex items-center justify-between text-gray-400 text-sm border-t border-gray-700 pt-3">
                <div class="flex items-center space-x-2">
                    <button class="like-button ${liked ? 'text-red-500' : 'text-gray-400'} hover:text-red-400 transition-colors">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
                    </button>
                    <span>${likesCount}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="comment-toggle-button hover:text-blue-400 transition-colors">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 13.5V16a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h4.586A2 2 0 0110 5.414L11.414 4A2 2 0 0112.828 4H16a2 2 0 012 2v7.5zM10 10a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2z" clip-rule="evenodd"></path></svg>
                    </button>
                    <span>${commentsCount}</span>
                </div>
            </div>
            <!-- Секция комментариев (скрыта по умолчанию) -->
            <div class="comments-section mt-4 border-t border-gray-700 pt-4 hidden">
                <h4 class="text-white font-semibold mb-2">Комментарии:</h4>
                <div class="comments-list text-gray-300 text-sm space-y-2">
                    ${product.comments && product.comments.length > 0 ? product.comments.map(c => `
                        <div class="bg-gray-700 p-2 rounded-md">
                            <p class="font-bold text-blue-300">${c.userEmail ? c.userEmail.split('@')[0] : 'Аноним'}:</p>
                            <p>${c.text}</p>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-xs">Пока нет комментариев.</p>'}
                </div>
                ${user ? `
                    <div class="add-comment-form mt-4">
                        <input type="text" placeholder="Добавить комментарий..." class="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button class="btn-primary mt-2 w-full text-sm">Отправить</button>
                    </div>
                ` : '<p class="text-gray-500 text-xs mt-2">Войдите, чтобы оставлять комментарии.</p>'}
            </div>
        `;

        // Добавление обработчиков событий для лайков
        const likeButton = card.querySelector('.like-button');
        likeButton.addEventListener('click', async () => {
            if (!user) {
                errorMessage.textContent = 'Войдите, чтобы ставить лайки.';
                openAuthModal(); // Открываем модальное окно входа
                return;
            }
            const productRef = doc(db, "products", product.id);
            if (liked) {
                // Если уже лайкнул, убираем лайк
                await updateDoc(productRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                // Если не лайкнул, ставим лайк
                await updateDoc(productRef, {
                    likes: arrayUnion(user.uid)
                });
            }
        });

        // Добавление обработчиков событий для комментариев
        const commentToggleButton = card.querySelector('.comment-toggle-button');
        const commentsSection = card.querySelector('.comments-section');
        commentToggleButton.addEventListener('click', () => {
            commentsSection.classList.toggle('hidden'); // Показать/скрыть секцию комментариев
        });

        const addCommentForm = card.querySelector('.add-comment-form');
        if (addCommentForm) {
            const commentInput = addCommentForm.querySelector('input');
            const sendCommentButton = addCommentForm.querySelector('button');
            sendCommentButton.addEventListener('click', async () => {
                const commentText = commentInput.value.trim();
                if (commentText === "") return;

                if (!user) {
                    errorMessage.textContent = 'Войдите, чтобы оставлять комментарии.';
                    openAuthModal();
                    return;
                }

                const productRef = doc(db, "products", product.id);
                await updateDoc(productRef, {
                    comments: arrayUnion({
                        userEmail: user.email,
                        text: commentText,
                        timestamp: new Date().toISOString() // Сохраняем в ISO формате для сортировки
                    })
                });
                commentInput.value = ''; // Очистить поле ввода
            });
        }
        return card;
    }

    // --- Логика добавления продукта ---
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = productNameInput.value;
        const description = productDescriptionInput.value;
        const price = productPriceInput.value;
        const imageUrl = productImageInput.value;

        if (!name || !description || !price) {
            alert('Пожалуйста, заполните все поля.'); // Временный alert
            return;
        }

        try {
            await addDoc(collection(db, "products"), {
                name,
                description,
                price,
                imageUrl,
                likes: [],
                comments: [],
                createdAt: new Date() // Добавляем метку времени для сортировки
            });
            alert('Продукт успешно добавлен!'); // Временный alert
            // Очистить форму
            productNameInput.value = '';
            productDescriptionInput.value = '';
            productPriceInput.value = '';
            productImageInput.value = '';
        } catch (error) {
            console.error("Ошибка при добавлении продукта:", error);
            alert('Ошибка при добавлении продукта: ' + error.message); // Временный alert
        }
    });
});
