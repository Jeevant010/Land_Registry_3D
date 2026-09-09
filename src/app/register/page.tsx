"use client";

import PropertyRegistrationForm from "@/components/PropertyRegistrationForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Property Registration
            </h1>
            <p className="text-gray-600">
              Register your land property on the blockchain. Fill in all required details and upload necessary documents.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <PropertyRegistrationForm />
      </div>
    </div>
  );
}
