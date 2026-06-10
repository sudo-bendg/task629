import mongoose from "mongoose";

const getConnection = async (connectionString: string) => {
    await mongoose.connect(connectionString);
    console.log("database connected");
};

export { getConnection };