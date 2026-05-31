require('dotenv').config();

const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


app.use(authRoutes);


authRoutes.initializeSystem().then(() => {
    app.listen(
        process.env.PORT,
        () => console.log('Servidor rodando')
    );
});
