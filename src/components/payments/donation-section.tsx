"use client";

import { useState } from "react";
import { DonateButton } from "./donate-button";
import { DonationModal } from "./donation-modal";

interface DonationSectionProps {
  ideaId: string;
  ideaTitle: string;
  founderName: string;
  totalDonations: number;
  donorCount: number;
}

export function DonationSection({
  ideaId,
  ideaTitle,
  founderName,
  totalDonations,
  donorCount,
}: DonationSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DonateButton
        onClick={() => setModalOpen(true)}
        totalDonations={totalDonations}
        donorCount={donorCount}
      />
      <DonationModal
        ideaId={ideaId}
        ideaTitle={ideaTitle}
        founderName={founderName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
