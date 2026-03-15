const mongoose = require("mongoose");

const UnknownQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("UnknownQuestion", UnknownQuestionSchema);