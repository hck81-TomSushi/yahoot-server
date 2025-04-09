const {getRandomIds} = require("../helpers/helper");
const {signToken, verifyToken} = require("../helpers/jwt");
const {Question} = require("../models");
const {GoogleGenerativeAI} = require("@google/generative-ai");

module.exports = class Controller {
  static login(req, res) {
    const {username} = req.body;
    if (!username) {
      return res.status(400).json({error: "Username is required"});
    }
    if (username.length < 3) {
      return res.status(400).json({error: "Username minimum is 3 characters"});
    }
    const usernameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({error: "Username must be alphanumeric"});
    }

    const access_token = signToken({username});
    res.status(200).json({access_token, username});
  }

  static getUsername(req, res) {
    try {
      const access_token = req.headers.authorization?.split(" ")[1];
      if (!access_token) {
        return res.status(401).json({error: "Unauthorized"});
      }
      const decoded = verifyToken(access_token);
      if (!decoded) {
        return res.status(401).json({error: "Unauthorized"});
      }
      res.status(200).json({username: decoded.username});
    } catch (error) {
      return res.status(401).json({error: "Unauthorized"});
    }
  }

  static async getQuestion(req, res) {
    try {
      const categories = [
        "Science",
        "History",
        "Math",
        "Technology",
        "Politics",
      ];
      let selectCategory =
        categories[Math.floor(Math.random() * categories.length)];
      let questionIds = await Question.findAll({
        where: {
          category: selectCategory,
        },
        attributes: ["id"],
      });
      let randomizedQuestionIds = getRandomIds(questionIds, 10);
      randomizedQuestionIds = randomizedQuestionIds.map(
        (question) => question.id
      );
      let questions = await Question.findAll({
        where: {
          id: randomizedQuestionIds,
        },
        attributes: {exclude: ["createdAt", "updatedAt"]},
      });
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      res.status(200).json({questions});
    } catch (error) {
      res.status(500).json({error: "Internal Server Error"});
    }
  }

  static async getHint(req, res) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const {question, answers} = req.body;

      const prompt = `Berikan saya petunjuk untuk menjawab pertanyaan ini.
      Pertanyaan: ${question}.
      Pilihan jawaban: ${answers}.
      Use this JSON schema:
      Return: {'hint':string}
      `;
      const result = (await model.generateContent(prompt)).response
        .candidates[0].content.parts[0].text;

      res.json(JSON.parse(result));
    } catch (error) {
      console.log(error);
      res.status(500).json({error: "Internal Server Error"});
    }
  }
};
