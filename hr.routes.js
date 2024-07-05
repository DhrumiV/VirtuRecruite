const path = require("path");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const upload = require("../helpers/multer");
const Recruiter = require("../db/hr.schema");

const files = upload.fields([
    { name: "image", maxCount: 1 },
]);

router.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/user/login")
    }
    res.render("user-dashboard.hbs", {
        layout: false,
        user: req.session.user.fullName,
        resume: req.session.user.resume,
        cv: req.session.user.cv,
    });
});

router.get("/register", (req, res) => {
    res.render("hr/register.hbs", {
        layout: false,
    });
});

router.post("/register", files, async (req, res) => {
    try {

        const { name, email, phone, company, location, position, experience, website, password } = req.body;

        if (!name || !email || !phone || !company || !location || !position || !experience || !website || !password || !req.files.image) {
            return res.json({
                type: 'error',
                message: 'Provide all fields',
            });
        }

        const image = req.files.image[0].filename;

        const recruiter = await Recruiter.findOne({ email });

        if (recruiter) {
            return res.json({
                type: 'error',
                message: 'Recruiter already exists',
            });
        }

        await Recruiter.create({
            name,
            email,
            phone,
            company,
            location,
            position,
            experience,
            website,
            password: bcrypt.hashSync(password, 10),
            image,
        });

        return res.json({
            type: 'success',
            message: '/hr/login',
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            type: 'error',
            message: 'Internal server error',
        });
    }
});

router.get("/login", (req, res) => {
    res.render("hr/login.hbs", {
        layout: false,
    });
});


router.post("hr/login", async (req, res) => {
    try {
        const { email = "", password = "" } = req.body;

        console.log(req.body);
        if (!password || !email)
            return res.json({
                type: 'error',
                message: 'Provide all fields'
            })

        const user = await User.findOne({ email });

        if (!user)
            return res.json({
                type: 'error',
                message: 'No such user'
            })

        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            return res.json({
                type: 'success',
                message: '/hr/dashboard'
            })
        } else {
            return res.json({
                type: 'error',
                message: 'Invalid credentials'
            })
        }

    } catch (e) {
        console.log(e);
    }
});

router.get("/dashboard", (req, res) => {
    return res.render("hr/recruiter-dashboard.hbs", {
        layout: false,
    });
});

router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.send('Error logging out');
        } else {
            // Redirect the user to the login page or any other page
            res.redirect('/hr/login');
        }
    });
});

module.exports = router;
