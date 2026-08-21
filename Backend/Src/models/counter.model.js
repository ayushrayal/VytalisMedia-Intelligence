const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    versionKey: false,
  }
);

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Atomically retrieves the next monotonically increasing integer sequence value.
 * @param {string} sequenceName
 * @returns {Promise<number>}
 */
const getNextSequenceValue = async (sequenceName) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  return counter.seq;
};

module.exports = {
  Counter,
  getNextSequenceValue,
};
