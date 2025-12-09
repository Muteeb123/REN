import Journal from "../Models/Journal.model.js";  

export const createJournal = async (req, res) => {
  try {
    const { userId, title, content, sentiment } = req.body;

    const isTitleEmpty = !title || title.trim() === "";
    const isContentEmpty = (!content || content.trim() === "");

    if (isTitleEmpty && isContentEmpty) {
      return res.status(400).json({
        message: "Either title or content must be provided.",
      });
    }

    const entry = await Journal.create({
      userId,
      title,
      content,
      sentiment
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const updateJournal = async (req, res) => {
  try {
    const { id, userId, title, content, sentiment} = req.body;
    const journal = await Journal.findById(id);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    journal.userId = userId || journal.userId;
    journal.title = title || journal.title;
    journal.content = content || journal.content;
    journal.sentiment = sentiment || journal.sentiment;
    await journal.save();
    res.status(200).json(journal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
};

export const deleteJournal = async (req, res) => {  
    try {
        const { id } = req.body;
        const journal = await Journal.findByIdAndDelete(id);
        if (!journal) {
            return res.status(404).json({ message: "Journal entry not found" });
        }
        res.status(200).json({ message: "Journal entry deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getJournals = async (req, res) => {
    try {
        const {userId} = req.params;
        const journals = await Journal.find({ userId}).sort({ createdAt: -1 });
        res.status(200).json(journals);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
