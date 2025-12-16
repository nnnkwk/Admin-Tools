// ⚠️ ВАЖНО: замените эти значения на свои!
const VK_APP_ID = '54400478'; // Ваш ID приложения VK
const REDIRECT_URI = 'https://nnnkwk.github.io/Admin-Tools/'; // Ваша ссылка
const VK_API_VERSION = '5.199';

// DOM элементы
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const profileContent = document.getElementById('profile-content');
const friendsContent = document.getElementById('friends-content');

// Проверяем авторизацию при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Настраиваем обработчики событий
function setupEventListeners() {
    if (loginBtn) {
        loginBtn.addEventListener('click', vkLogin);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Авторизация через VK
function vkLogin() {
    // Формируем URL для авторизации
    const authUrl = `https://oauth.vk.com/authorize?` +
        `client_id=${VK_APP_ID}` +
        `&display=page` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=token` +
        `&scope=friends,photos,email` +
        `&v=${VK_API_VERSION}`;
    
    // Открываем в новом окне или переходим
    window.location.href = authUrl;
}

// Проверяем токен в URL (VK возвращает токен в hash)
function checkAuth() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const userId = params.get('user_id');
    
    if (accessToken && userId) {
        // Сохраняем токен
        localStorage.setItem('vk_token', accessToken);
        localStorage.setItem('vk_user_id', userId);
        
        // Убираем токен из URL для безопасности
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Загружаем информацию о пользователе
        loadUserInfo(accessToken, userId);
    } else {
        // Проверяем сохраненный токен
        const savedToken = localStorage.getItem('vk_token');
        const savedUserId = localStorage.getItem('vk_user_id');
        
        if (savedToken && savedUserId) {
            loadUserInfo(savedToken, savedUserId);
        } else {
            showLoginButton();
        }
    }
}

// Загружаем информацию о пользователе
function loadUserInfo(token, userId) {
    // Используем VK API для получения данных
    fetch(`https://api.vk.com/method/users.get?` +
        `user_ids=${userId}` +
        `&fields=photo_200,first_name,last_name,city` +
        `&access_token=${token}` +
        `&v=${VK_API_VERSION}`)
    .then(response => response.json())
    .then(data => {
        if (data.response && data.response[0]) {
            const user = data.response[0];
            showUserInfo(user, token);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки данных:', error);
        logout();
    });
}

// Показываем информацию о пользователе
function showUserInfo(user, token) {
    // Скрываем кнопку входа
    loginBtn.style.display = 'none';
    
    // Показываем информацию о пользователе
    userInfo.classList.remove('hidden');
    
    // Заполняем данные
    userAvatar.src = user.photo_200 || 'https://via.placeholder.com/200';
    userName.textContent = `${user.first_name} ${user.last_name}`;
    
    // Заполняем вкладку профиля
    profileContent.innerHTML = `
        <div class="profile-card">
            <img src="${user.photo_200 || 'https://via.placeholder.com/200'}" 
                 alt="Аватар" class="profile-avatar">
            <div class="profile-info">
                <h3>${user.first_name} ${user.last_name}</h3>
                <p><i class="fas fa-city"></i> ${user.city ? user.city.title : 'Город не указан'}</p>
                <p><i class="fas fa-id-card"></i> ID: ${user.id}</p>
            </div>
        </div>
    `;
    
    // Загружаем друзей
    loadFriends(token);
}

// Загружаем список друзей
function loadFriends(token) {
    fetch(`https://api.vk.com/method/friends.get?` +
        `fields=photo_100,first_name,last_name` +
        `&access_token=${token}` +
        `&v=${VK_API_VERSION}`)
    .then(response => response.json())
    .then(data => {
        if (data.response && data.response.items) {
            const friends = data.response.items.slice(0, 10); // Берем первых 10 друзей
            showFriends(friends);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки друзей:', error);
        friendsContent.innerHTML = '<p>Не удалось загрузить список друзей</p>';
    });
}

// Показываем друзей
function showFriends(friends) {
    if (friends.length === 0) {
        friendsContent.innerHTML = '<p>У вас пока нет друзей в VK</p>';
        return;
    }
    
    let html = '<div class="friends-grid">';
    friends.forEach(friend => {
        html += `
            <div class="friend-card">
                <img src="${friend.photo_100}" alt="${friend.first_name}">
                <div class="friend-info">
                    <strong>${friend.first_name} ${friend.last_name}</strong>
                </div>
            </div>
        `;
    });
    html += '</div>';
    friendsContent.innerHTML = html;
}

// Показываем кнопку входа
function showLoginButton() {
    loginBtn.style.display = 'flex';
    userInfo.classList.add('hidden');
    profileContent.innerHTML = 'Войдите, чтобы увидеть информацию';
    friendsContent.innerHTML = 'Войдите, чтобы увидеть список друзей';
}

// Выход из системы
function logout() {
    localStorage.removeItem('vk_token');
    localStorage.removeItem('vk_user_id');
    showLoginButton();
    
    // Перенаправляем на главную
    window.location.href = window.location.pathname;
}