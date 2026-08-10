import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../../../components/shared/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import MetaAccountCard from "../components/MetaAccountCard.jsx";
import MetaAccountFormModal from "../components/MetaAccountFormModal.jsx";
import MetaAccountDeleteModal from "../components/MetaAccountDeleteModal.jsx";
import {
  getMetaAccounts,
  addMetaAccount,
  updateMetaAccount,
  deleteMetaAccount,
  setActiveMetaAccount,
} from "../services/meta.api.js";
import { getErrorMessage } from "../../../utils/error.js";

export const MetaAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [activeMetaAccount, setActiveMetaAccountState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [switchingId, setSwitchingId] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMetaAccounts();
      if (res.data) {
        setAccounts(res.data.accounts || []);
        setActiveMetaAccountState(res.data.activeMetaAccount || null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle Set Active Account
  const handleSetActive = async (accountId) => {
    try {
      setSwitchingId(accountId);
      const res = await setActiveMetaAccount(accountId);
      if (res.data) {
        setActiveMetaAccountState(res.data.activeMetaAccount);
        // Refresh full accounts list to ensure synced state
        await fetchAccounts();
      }
    } catch (err) {
      alert(`Failed to set active account: ${getErrorMessage(err)}`);
    } finally {
      setSwitchingId(null);
    }
  };

  // Handle Add/Edit Form Submit
  const handleFormSubmit = async ({ accountName, accountId }) => {
    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingAccount) {
        // Edit Mode
        const res = await updateMetaAccount(editingAccount.accountId, {
          accountName,
          accountId,
        });
        if (res.data) {
          setIsFormOpen(false);
          setEditingAccount(null);
          await fetchAccounts();
        }
      } else {
        // Add Mode
        const res = await addMetaAccount({ accountName, accountId });
        if (res.data) {
          setIsFormOpen(false);
          await fetchAccounts();
        }
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;

    try {
      setDeleteSubmitting(true);
      setDeleteError(null);

      await deleteMetaAccount(deletingAccount.accountId);
      setIsDeleteOpen(false);
      setDeletingAccount(null);
      await fetchAccounts();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Meta Accounts"
        subtitle="Connect and manage the Meta advertising accounts used by Vytalis Intelligence"
        actions={
          <Button
            onClick={() => {
              setEditingAccount(null);
              setIsFormOpen(true);
            }}
          >
            + Add Meta Account
          </Button>
        }
      />

      {/* Settings Integration Summary Card */}
      <div
        style={{
          backgroundColor: "var(--color-surface, #F7F9FC)",
          borderRadius: "var(--radius-card, 16px)",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 4px 0", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
            Meta Advertising Integrations
          </h4>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary, #64748B)" }}>
            Select an active Meta ad account to switch campaign and performance analytics across all dashboard views.
          </p>
        </div>

        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-primary, #111827)" }}>
          Connected Accounts: <strong style={{ color: "#0A84FF" }}>{accounts.length}</strong>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          <Skeleton height="180px" />
          <Skeleton height="180px" />
        </div>
      ) : error ? (
        <ErrorState title="Unable to load Meta accounts" message={error} onRetry={fetchAccounts} />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No Meta accounts connected"
          description="Connect your Meta advertising account to start viewing campaign and performance analytics."
          action={
            <Button
              onClick={() => {
                setEditingAccount(null);
                setIsFormOpen(true);
              }}
            >
              + Add Meta Account
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {accounts.map((account) => {
            const isActive = account.accountId === activeMetaAccount;
            const isSwitching = switchingId === account.accountId;
            return (
              <MetaAccountCard
                key={account.accountId}
                account={account}
                isActive={isActive}
                onSetActive={handleSetActive}
                onEdit={(acc) => {
                  setEditingAccount(acc);
                  setIsFormOpen(true);
                }}
                onDelete={(acc) => {
                  setDeletingAccount(acc);
                  setIsDeleteOpen(true);
                }}
                isSwitching={isSwitching}
              />
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <MetaAccountFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAccount}
        isSubmitting={formSubmitting}
        error={formError}
      />

      {/* Delete Confirmation Modal */}
      <MetaAccountDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingAccount(null);
        }}
        onConfirm={handleDeleteConfirm}
        account={deletingAccount}
        isDeleting={deleteSubmitting}
        error={deleteError}
      />
    </div>
  );
};

export default MetaAccounts;
