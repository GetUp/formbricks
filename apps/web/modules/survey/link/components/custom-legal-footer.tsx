"use client";

import Link from "next/link";
import { useState } from "react";

interface LegalFooterProps {
  IMPRINT_URL?: string;
  PRIVACY_URL?: string;
  IS_FORMBRICKS_CLOUD: boolean;
  surveyUrl: string;
}

export const CustomLegalFooter = ({ PRIVACY_URL }: LegalFooterProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const privacyUrl = PRIVACY_URL || "https://www.getup.org.au/privacy-policy";
  const sourceCodeUrl = "https://github.com/GetUp/formbricks";

  return (
    <>
      <div className="absolute bottom-0 z-[1500] h-10 w-full" role="contentinfo">
        <div className="mx-auto flex h-full max-w-2xl items-center justify-center p-2 text-center text-xs text-slate-500">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="hover:underline focus:outline-none"
            tabIndex={-1}>
            Legal
          </button>
        </div>
      </div>

      {/* Legal Dialog */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
          onClick={() => setIsDialogOpen(false)}>
          <div
            className="relative mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              aria-label="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dialog content */}
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Legal Information</h2>

            <div className="space-y-6">
              {/* Privacy Policy */}
              <div>
                <h3 className="mb-2 font-medium text-slate-700">Privacy Policy</h3>
                <Link
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline">
                  {privacyUrl}
                </Link>
              </div>

              {/* Source Code */}
              <div>
                <h3 className="mb-2 font-medium text-slate-700">Source Code</h3>
                <p className="mb-2 text-sm text-slate-600">
                  This software is licensed under AGPLv3. View the source code:
                </p>
                <Link
                  href={sourceCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline">
                  {sourceCodeUrl}
                </Link>
              </div>

              {/* Attribution */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">Based on Formbricks by Formbricks GmbH</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
