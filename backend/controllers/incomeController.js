import incomeModel from "../models/incomeModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dateFilter.js";

// add income
export async function addIncome(req, res) {
    const userId = req.user._id
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number"
            });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount: Number(amount),
            category,
            date: new Date(date)
        });
        await newIncome.save()
        res.json({
            success: true,
            message: "Income added successfully!"
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get income(all)
export async function getAllIncome(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        res.json(income);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// update an income
export async function updateIncome(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        const updateFields = {};
        if (description !== undefined) updateFields.description = description;
        if (category !== undefined) updateFields.category = category;
        if (date !== undefined) updateFields.date = new Date(date);
        if (amount !== undefined) {
            if (isNaN(Number(amount)) || Number(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be a positive number"
                });
            }
            updateFields.amount = Number(amount);
        }

        const updatedIncome = await incomeModel.findOneAndUpdate(
            { _id: id, userId },
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }

        res.json({
            success: true, message: "Income updated successfully.", data:
                updatedIncome
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to delete an income
export async function deleteIncome(req, res) {
    const userId = req.user._id;
    try {
        // Scoped to the logged-in user so no one can delete another
        // user's data just by guessing/knowing an id.
        const income = await incomeModel.findOneAndDelete({ _id: req.params.id, userId });
        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }
        return res.json({
            success: true,
            message: "Income deleted successfully!"
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to download the data in an excel sheet
export async function downloadIncomeExcel(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        const plainData = income.map((inc) => ({
            Description: inc.description,
            Amount: inc.amount,
            Category: inc.category,
            Date: new Date(inc.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");

        // Write to an in-memory buffer per-request instead of a shared
        // file on disk (see same note in expenseController.js).
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Disposition", "attachment; filename=income_details.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get income overview
export async function getIncomeOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const incomes = await incomeModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });


        const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
        const numberOfTransactions = incomes.length;
        const recentTransactions = incomes.slice(0, 9);

        res.json({
            success: true,
            data: {
                totalIncome,
                averageIncome,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}