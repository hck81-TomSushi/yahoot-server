const { getRandomIds } = require("../helpers/helper");
const { signToken } = require("../helpers/jwt");
const { Question } = require("../models");

module.exports = class Controller {
    static login(req, res) {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        const access_token = signToken({ username })
        res.status(200).json({ access_token });
    }

    static async getQuestion(req, res) {
        try {
            const categories = [
                "Science",
                "History",
                "Math",
                "Technology",
                "Politics"
            ]
            let selectCategory = categories[Math.floor(Math.random() * categories.length)]
            let questionIds = await Question.findAll({
                where: {
                    category: selectCategory
                },
                attributes: ['id']
            })
            let randomizedQuestionIds = getRandomIds(questionIds, 10)
            let questions = await Question.findAll({
                where: {
                    id: randomizedQuestionIds
                },
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
            res.status(200).json({ questions });
        } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}