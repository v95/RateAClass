var express = require('express');
var router = express.Router();
var passport = require("passport");
var School = require('../model/School');
var Class = require('../model/Class');
var User = require('../model/Users');
var Review = require('../model/Review');
var bookshelf = require('../config/bookshelf');
var jwt = require('express-jwt');
var auth = jwt({secret: '0010', userProperty: 'payload'});

router.get('/search/school/:name', function (req, res, next) {
	var school = req.params.name;

	School.query(function (q) { 
		q.where('name', 'LIKE', '%' + school + '%');
	}).fetchAll().then(function (schools) {
		res.json(schools);
	}).catch(function (err) {
		console.log(err);
		res.send('An error occured');
	});
});

router.get('/search/:school/:class', function (req, res, next) {
	var school = req.params.school;
	var classes = req.params.class;
	var query = { where: { school: school }, limit: 10 };
	if (classes != "all")
		query = { where: { school: school, name: { $like: '%' + classes + '%' } }, limit: 10 };

	Class.query(query).fetchAll().then(function (classes) {
		res.json(classes);
	}).catch(function (err) {
		console.log(err);
		res.send('An error occured');
	});
});

router.get('/school/:unique', function (req, res, next) {
	var unique = req.params.unique;

	School.query({ where: { unique_str: unique } }).fetchAll().then(function (schools) {
		res.json(schools);
	}).catch(function (err) {
		console.log(err);
		res.send('An error occured');
	});
});

router.get('/reviews/:course', function (req, res, next) {
	var course = req.params.course;
	bookshelf.knex.raw("SELECT r.id, r.review, r.usr, r.school, r.datetime, r.rating as score, c.name as title, c.rating, s.name, s.location, u.name as username FROM reviews r, class c, users u, school s WHERE r.class = c.id AND c.id = ? AND u.id = r.usr AND s.unique_str = r.school;", course).then(function (data) {
		if (data[0].length == 0) {
			bookshelf.knex.raw("SELECT c.name as title, c.rating, s.name, s.location, s.unique_str as school FROM class c, school s WHERE c.id = ? AND s.unique_str = c.school", course).then(function (data) {
				console.log(data[0]);
				res.json(data[0]);
			}).catch(function (err) {
				console.log(err);
				res.send('An error occured');
			});
		}
		else
			res.json(data[0]);
	}).catch(function (err) {
		console.log(err);
		res.send('An error occured');
	});
});

router.get('/class/:unique', function (req, res, next) {
	var unique = req.params.unique;

	Class.query({ where: { id: unique } }).fetch().then(function (classItem) {
		res.json(classItem);
	}).catch(function (err) {
		console.log(err);
		res.send('An error occured');
	});
});

router.post('/review/post', auth, function(req, res, next) {
	try {
		var datetime = Math.floor(Date.now() / 1000);
		new Review({
			review: req.body.text,
			username: req.body.username,
			school: req.body.school,
			class: req.body.class_id,
			rating: req.body.rating,
			score: req.body.score,
			datetime: datetime
		}).save()
		.then(function (model) {
			if (model === null) {
				res.json({ message: "Error" });
			} else {
				bookshelf.knex.raw("SELECT AVG(rating) as average FROM reviews where class = ?", req.body.class_id).then(function (data) {
					var rating = JSON.parse(JSON.stringify(data[0][0])).average;
					new Class({id: req.body.class_id}).save({rating: rating}, {patch: true}).then(function(model) {
						res.json({message: "Success"});
					});
				}).catch(function (err) {
					console.log(err);
					res.send('An error occured');
				});
			}
		}).catch(function(ex) {
			console.log(ex.stack);
		});
	} catch (ex) {
		console.log(ex.stack);
	}
})

router.post('/auth/register', function(req, res, next) {
	if (!req.body.name || !req.body.email || !req.body.password) {
		return res.sendStatus(400).json({message: 'Please fill out all fields'});
	}
	try {
		User.createPassword(req.body.password).then(function(hash) {
			return new User({
				name: req.body.name,
				email: req.body.email,
				password: hash
			}).save();
		}).then(function (model) {
			return res.json({token: model.generateJWT({ attributes: {id: model.attributes.id, name: req.body.name}})});
		}).catch(function(ex) {
			console.log(ex.stack);
		});
	} catch (ex) {
		console.log(ex.stack);
	}
});

router.post("/auth/login", function (req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.sendStatus(400).json({ message: "Please fill out all fields" });
	}

	passport.authenticate("local", function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (user) {
			return res.json({ token: user.generateJWT(user) });
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
});

module.exports = router;
