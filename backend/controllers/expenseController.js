import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from 'xlsx';

// add expense
export async function addExpense(req, res) {
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

        const newExpense = new expenseModel({
            userId,
            description,
            amount: Number(amount),
            category,
            date: new Date(date)
        });

        await newExpense.save()
        res.json({
            success: true,
            message: "Expense added successfully!"
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

// to all expense
export async function getAllExpense(req, res) {
    const userId = req.user._id;
    try {
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });
        res.json(expense);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to update the expense
export async function updateExpense(req, res) {
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

        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true, message: "Expense updated successfully.", data:
                updatedExpense
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

// delete an expense
export async function deleteExpense(req, res) {
    const userId = req.user._id;
    try {
        // Scoped to the logged-in user so no one can delete another
        // user's data just by guessing/knowing an id.
        const expense = await expenseModel.findOneAndDelete({ _id: req.params.id, userId });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }
        return res.json({
            success: true,
            message: "Expense deleted successfully!"
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

// download excel for expense
export async function downloadExpenseExcel(req, res) {
    const userId = req.user._id;
    try {
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });
        const plainData = expense.map((exp) => ({
            Description: exp.description,
            Amount: exp.amount,
            Category: exp.category,
            Date: new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "expenseModel");

        // Write to an in-memory buffer per-request instead of a shared
        // file on disk — the old version wrote to the same filename for
        // every user/request, so concurrent downloads could overwrite
        // or serve each other's data.
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Disposition", "attachment; filename=expense_details.xlsx");
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

// to get overview of expense
export async function getExpenseOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const expense = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });


        const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
        const averageExpense =
            expense.length > 0 ? totalExpense / expense.length : 0;
        const numberOfTransactions = expense.length;
        const recentTransactions = expense.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
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