UPDATE users SET passwordHash = 'pbkdf2$100000$c3f9530ef9ea05ae5cc0662a8a5f965e$3f12b7d07129db9aaeca6200bebeb7a6cbbf78614054afe9b4e4d519ced0f9ee' WHERE email = 'tripetkk@gmail.com';
SELECT email, name, role FROM users WHERE email = 'tripetkk@gmail.com';
