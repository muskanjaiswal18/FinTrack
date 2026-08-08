import React from "react";
import { modalStyles } from "../assets/dummyStyles";
import { X } from "lucide-react";

const AddTransactionModal = ({
  showModal,
  setShowModal,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  type = "both",
  title = "Add New Transaction",
  buttonText = "Add Transaction",
  categories,
  color = "teal",
}) => {
  if (!showModal) return null;

  const EXPENSE_CATEGORIES = [
    "Food",
    "Housing",
    "Transport",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Other",
  ];
  const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investments",
    "Bonus",
    "Other",
  ];

  // When the caller passes an explicit `categories` list (Income.jsx and
  // Expense.jsx both do this) we respect it as-is. Only the shared "both"
  // modal (used by Dashboard.jsx) needs to switch lists based on the
  // currently selected type, since it previously offered a merged list
  // that let an income entry get saved with an expense-only category
  // (or vice versa).
  const resolvedCategories =
    categories ||
    (newTransaction.type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES);

  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentDate = today.toISOString().split("T")[0];
  const minDate = `${currentYear}-01-01`;

  const colorClass = modalStyles.colorClasses[color];

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modalContainer}>
        <div className={modalStyles.modalHeader}>
          <h3 className={modalStyles.modalTitle}>{title}</h3>
          <button
            onClick={() => setShowModal(false)}
            className={modalStyles.closeButton}
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTransaction();
          }}
        >
          <div className={modalStyles.form}>
            <div>
              <label className={modalStyles.label}>Description</label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={modalStyles.input(colorClass.ring)}
                placeholder={
                  type === "both"
                    ? "Salary, Funds, etc."
                    : "Groceries, Rent, etc."
                }
                required
              />
            </div>

            <div>
              <label className={modalStyles.label}>Amount</label>
              <input
                type="number"
                value={newTransaction.amount}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className={modalStyles.input(colorClass.ring)}
                placeholder="0.00"
                required
              />
            </div>

            {type === "both" && (
              <div>
                <label className={modalStyles.label}>Type</label>
                <div className={modalStyles.typeButtonContainer}>
                  <button
                    type="button"
                    className={modalStyles.typeButton(
                      newTransaction.type === "income",
                      modalStyles.colorClasses.teal.typeButtonSelected,
                    )}
                    onClick={() =>
                      setNewTransaction((prev) =>
                        prev.type === "income"
                          ? prev
                          : {
                              ...prev,
                              type: "income",
                              // Reset category so it can't stay on an
                              // expense-only category (e.g. "Food") when
                              // switching to Income.
                              category: "Salary",
                            },
                      )
                    }
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={modalStyles.typeButton(
                      newTransaction.type === "expense",
                      modalStyles.colorClasses.orange.typeButtonSelected,
                    )}
                    onClick={() =>
                      setNewTransaction((prev) =>
                        prev.type === "expense"
                          ? prev
                          : {
                              ...prev,
                              type: "expense",
                              // Reset category so it can't stay on an
                              // income-only category (e.g. "Salary") when
                              // switching to Expense.
                              category: "Food",
                            },
                      )
                    }
                  >
                    Expense
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className={modalStyles.label}>Category</label>
              <select
                value={newTransaction.category}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className={modalStyles.input(colorClass.ring)}
              >
                {resolvedCategories.map((cat) => (
                  <option value={cat} key={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={modalStyles.label}>Date</label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className={modalStyles.input(colorClass.ring)}
                min={minDate}
                max={currentDate}
                required
              />
            </div>

            <button
              type="submit"
              className={modalStyles.submitButton(colorClass.button)}
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;