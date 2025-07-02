const firebaseConfig = {
      apiKey: "AIzaSyBcxMmLr4OEp31AbN9va2o4vz2EaVNXcHU",
      authDomain: "chat-room-fd619.firebaseapp.com",
      databaseURL: "https://chat-room-fd619-default-rtdb.firebaseio.com",
      projectId: "chat-room-fd619",
      storageBucket: "chat-room-fd619.firebasestorage.app",
      messagingSenderId: "193712381688",
      appId: "1:193712381688:web:b8c185148cd09a80f9250d",
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const chat = document.getElementById('chat');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('msg');
    const overlay = document.getElementById('overlay');
    const nameInput = document.getElementById('name-input');
    const typingDiv = document.getElementById('typing');
    const onlineUsersDiv = document.getElementById('online-users');
    const notifSound = document.getElementById('notif-sound');

    let currentUsername = "";
    let typingTimeout;

    // Load username
    if (localStorage.getItem("username")) {
      currentUsername = localStorage.getItem("username");
      overlay.style.display = "none";
      setPresence();
    }

    function setUsername() {
      const name = nameInput.value.trim();
      if (name) {
        currentUsername = name;
        localStorage.setItem("username", name);
        overlay.style.display = "none";
        setPresence();
      }
    }

    function setPresence() {
      const userRef = db.ref("presence/" + currentUsername);
      userRef.set(true);
      userRef.onDisconnect().remove();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text && currentUsername) {
        const timestamp = Date.now();
        db.ref('messages').push({ username: currentUsername, text, timestamp });
        db.ref("typing/" + currentUsername).remove();
        input.value = '';
      }
    });

    input.addEventListener("input", () => {
      db.ref("typing/" + currentUsername).set(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        db.ref("typing/" + currentUsername).remove();
      }, 2000);
    });

    db.ref('messages').on('child_added', (snapshot) => {
      const { username, text, timestamp } = snapshot.val();
      const msg = document.createElement('div');
      msg.className = 'message';
      msg.classList.add(username === currentUsername ? 'me' : 'them');

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${username} • ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const body = document.createElement('div');
      body.textContent = text;

      msg.appendChild(meta);
      msg.appendChild(body);
      chat.appendChild(msg);
      chat.scrollTop = chat.scrollHeight;

      if (username !== currentUsername) {
  notifSound.currentTime = 0; // rewind in case it's playing
  notifSound.play().catch((err) => {
    console.warn("Audio play failed:", err);
  });
}
    });

    db.ref("typing").on("value", (snapshot) => {
      const data = snapshot.val();
      let typingUsers = [];

      for (let user in data) {
        if (user !== currentUsername) {
          typingUsers.push(user);
        }
      }

      if (typingUsers.length) {
        typingDiv.innerHTML = `${typingUsers.join(", ")} is typing <div class="dots"><span></span><span></span><span></span></div>`;
      } else {
        typingDiv.innerHTML = "";
      }
    });

    db.ref("presence").on("value", (snapshot) => {
      const data = snapshot.val();
      const names = data ? Object.keys(data) : [];
      onlineUsersDiv.innerHTML = names.map(name =>
        `<div class="user-pill"><span class="user-dot"></span>${name}</div>`
      ).join("");
    });