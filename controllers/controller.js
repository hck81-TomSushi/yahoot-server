const { signToken } = require("../helpers/jwt");

module.exports = class Controller {
    static login(req, res) {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        const access_token = signToken({ username })
        res.status(200).json({ access_token, username });
    }
}