"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/language";

type AIResult = {
  category: string;
  confidence: number;
  manual_verification_required: boolean;
  model: string;
};

export default function ReportWastePage() {
  const [language, setLanguage] = useState<Language>("en");

  const [location, setLocation] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [priorityScore, setPriorityScore] = useState(0);
  const [priorityLevel, setPriorityLevel] = useState("LOW");

  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "smartwaste-language"
    );

    if (savedLanguage === "en" || savedLanguage === "ta") {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);
    localStorage.setItem(
      "smartwaste-language",
      newLanguage
    );
  }

  function text(english: string, tamil: string) {
    return language === "en" ? english : tamil;
  }

  function calculatePriority(
    selectedCategory: string,
    selectedQuantity: string
  ) {
    let score = 0;

    switch (selectedCategory) {
      case "Plastic":
        score += 10;
        break;
      case "Organic":
        score += 10;
        break;
      case "Paper":
        score += 10;
        break;
      case "Metal":
        score += 15;
        break;
      case "Glass":
        score += 15;
        break;
      case "Mixed Waste":
        score += 25;
        break;
      case "E-waste":
        score += 35;
        break;
      case "Hazardous":
        score += 50;
        break;
    }

    switch (selectedQuantity) {
      case "medium":
        score += 10;
        break;
      case "large":
        score += 20;
        break;
      case "very-large":
        score += 30;
        break;
    }

    let level = "LOW";

    if (score >= 61) {
      level = "HIGH";
    } else if (score >= 31) {
      level = "MEDIUM";
    }

    setPriorityScore(score);
    setPriorityLevel(level);

    return {
      score,
      level,
    };
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    calculatePriority(value, quantity);
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    calculatePriority(category, value);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        text(
          "Geolocation is not supported by this browser.",
          "இந்த உலாவியில் இருப்பிட வசதி ஆதரிக்கப்படவில்லை."
        )
      );
      return;
    }

    setLocationStatus(
      text(
        "Getting your current location...",
        "உங்கள் தற்போதைய இருப்பிடம் பெறப்படுகிறது..."
      )
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation(`${latitude}, ${longitude}`);

        setLocationStatus(
          text(
            "Current location detected successfully.",
            "தற்போதைய இருப்பிடம் வெற்றிகரமாக கண்டறியப்பட்டது."
          )
        );
      },
      () => {
        setLocationStatus(
          text(
            "Unable to access your location. Please allow location permission.",
            "உங்கள் இருப்பிடத்தை அணுக முடியவில்லை. இருப்பிட அனுமதியை வழங்கவும்."
          )
        );
      }
    );
  }

  async function classifyImage(file: File) {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/classify`, 
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "AI classification failed."
        );
      }

      const result: AIResult = data.classification;

      setAiResult(result);
      setCategory(result.category);

      calculatePriority(result.category, quantity);
    } catch (error) {
      console.error(error);

      setAiError(
        text(
          "Unable to classify the image. Make sure the FastAPI backend is running.",
          "படத்தை AI மூலம் வகைப்படுத்த முடியவில்லை. FastAPI backend இயங்குகிறதா என்பதை சரிபார்க்கவும்."
        )
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setAiResult(null);
      setAiError("");
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    await classifyImage(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        text(
          "Please login before submitting a waste report.",
          "கழிவு புகாரை சமர்ப்பிக்கும் முன் உள்நுழையவும்."
        )
      );

      setLoading(false);
      return;
    }

    if (!imageFile) {
      setMessage(
        text(
          "Please select a waste image.",
          "கழிவு படத்தைத் தேர்ந்தெடுக்கவும்."
        )
      );

      setLoading(false);
      return;
    }

    if (aiLoading) {
      setMessage(
        text(
          "Please wait for AI classification to finish.",
          "AI வகைப்படுத்தல் முடியும் வரை காத்திருக்கவும்."
        )
      );

      setLoading(false);
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;

    const parts = location.split(",");

    if (parts.length === 2) {
      const parsedLatitude = Number(parts[0].trim());
      const parsedLongitude = Number(parts[1].trim());

      if (
        !Number.isNaN(parsedLatitude) &&
        !Number.isNaN(parsedLongitude)
      ) {
        latitude = parsedLatitude;
        longitude = parsedLongitude;
      }
    }

    const finalPriority = calculatePriority(
      category,
      quantity
    );

    const fileExtension =
      imageFile.name.split(".").pop() || "jpg";

    const fileName =
      `${user.id}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("waste-images")
        .upload(fileName, imageFile);

    if (uploadError) {
      setMessage(
        text(
          `Image upload error: ${uploadError.message}`,
          `பட பதிவேற்ற பிழை: ${uploadError.message}`
        )
      );

      setLoading(false);
      return;
    }

    const { data: publicUrlData } =
      supabase.storage
        .from("waste-images")
        .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const { error: reportError } = await supabase
      .from("waste_reports")
      .insert({
        citizen_id: user.id,
        image_url: imageUrl,
        location_text: location,
        latitude,
        longitude,
        quantity: quantity || null,
        description: description || null,

        ai_category:
          aiResult?.category || category || null,

        ai_confidence:
          aiResult?.confidence ?? null,

        manual_verification_required:
          aiResult?.manual_verification_required ?? true,

        status: "PENDING",

        priority_score: finalPriority.score,
        priority_level: finalPriority.level,
      });

    if (reportError) {
      setMessage(
        text(
          `Report error: ${reportError.message}`,
          `புகார் பிழை: ${reportError.message}`
        )
      );

      setLoading(false);
      return;
    }

    setMessage(
      text(
        `Waste report submitted successfully. AI detected ${
          aiResult?.category || category
        }. Priority: ${finalPriority.level}`,
        `கழிவு புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. AI வகை: ${
          aiResult?.category || category
        }. முன்னுரிமை: ${finalPriority.level}`
      )
    );

    setLocation("");
    setLocationStatus("");
    setQuantity("");
    setCategory("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setAiResult(null);
    setAiError("");
    setPriorityScore(0);
    setPriorityLevel("LOW");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-green-700">
              SmartWaste TN
            </h1>

            <p className="text-xs text-slate-500">
              {text(
                "Citizen Portal • Report Waste",
                "குடிமக்கள் தளம் • கழிவு புகார்"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  language === "en"
                    ? "bg-green-700 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("ta")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  language === "ta"
                    ? "bg-green-700 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                தமிழ்
              </button>
            </div>

            <Link
              href="/citizen"
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              ←{" "}
              {text(
                "Citizen Dashboard",
                "குடிமக்கள் முகப்பு"
              )}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-medium text-green-700">
              {text("New Complaint", "புதிய புகார்")}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {text("Report Waste", "கழிவு புகார் அளிக்க")}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {text(
                "Upload a waste image. SmartWaste AI will automatically analyze the waste category.",
                "கழிவு படத்தை பதிவேற்றவும். SmartWaste AI கழிவு வகையை தானாக கண்டறியும்."
              )}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* IMAGE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {text("Waste Image", "கழிவு படம்")}
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={handleImageChange}
                className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700"
              />

              {imagePreview && (
                <div className="mt-4 overflow-hidden rounded-xl border bg-slate-50 p-3">
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    {text("Image Preview", "பட முன்னோட்டம்")}
                  </p>

                  <div className="relative h-72 w-full overflow-hidden rounded-lg">
                    <Image
                      src={imagePreview}
                      alt="Waste preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>

                  {imageFile && (
                    <div className="mt-3 text-xs text-slate-500">
                      <p>
                        {text("File", "கோப்பு")}:{" "}
                        {imageFile.name}
                      </p>

                      <p>
                        {text("Size", "அளவு")}:{" "}
                        {(
                          imageFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI RESULT */}
            <div className="rounded-xl border border-green-300 bg-green-50 p-5">
              <h3 className="text-sm font-semibold text-green-800">
                🤖{" "}
                {text(
                  "SmartWaste AI Classification",
                  "SmartWaste AI கழிவு வகைப்படுத்தல்"
                )}
              </h3>

              {!imageFile && (
                <p className="mt-2 text-sm text-slate-600">
                  {text(
                    "Upload a waste image to start AI classification.",
                    "AI வகைப்படுத்தலை தொடங்க கழிவு படத்தை பதிவேற்றவும்."
                  )}
                </p>
              )}

              {aiLoading && (
                <div className="mt-3">
                  <p className="font-medium text-green-700">
                    🔄{" "}
                    {text(
                      "AI is analyzing the waste image...",
                      "AI கழிவு படத்தை ஆய்வு செய்கிறது..."
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {text(
                      "The first classification may take a little longer while the AI model loads.",
                      "AI மாடல் முதன்முறையாக ஏற்றப்படுவதால் சிறிது நேரம் ஆகலாம்."
                    )}
                  </p>
                </div>
              )}

              {aiError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {aiError}
                </p>
              )}

              {aiResult && !aiLoading && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {text(
                        "AI Detected Category",
                        "AI கண்டறிந்த கழிவு வகை"
                      )}
                    </p>

                    <p className="text-xl font-bold text-green-800">
                      {aiResult.category}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {text("Confidence", "நம்பகத்தன்மை")}
                    </p>

                    <p className="font-bold text-slate-800">
                      {aiResult.confidence.toFixed(2)}%
                    </p>
                  </div>

                  {aiResult.manual_verification_required ? (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <p className="text-sm font-semibold text-orange-700">
                        ⚠{" "}
                        {text(
                          "Manual verification required",
                          "நிர்வாகி சரிபார்ப்பு தேவை"
                        )}
                      </p>

                      <p className="mt-1 text-xs text-orange-600">
                        {text(
                          "AI confidence is below 70%. An admin can verify this classification.",
                          "AI நம்பகத்தன்மை 70%-க்கு கீழே உள்ளது. நிர்வாகி இந்த வகைப்படுத்தலை சரிபார்க்கலாம்."
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-green-200 bg-white p-3">
                      <p className="text-sm font-semibold text-green-700">
                        ✓{" "}
                        {text(
                          "High-confidence AI classification",
                          "அதிக நம்பகத்தன்மையுள்ள AI வகைப்படுத்தல்"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LOCATION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {text("Location", "இருப்பிடம்")}
              </label>

              <input
                type="text"
                required
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder={text(
                  "Example: Gandhipuram, Coimbatore",
                  "உதாரணம்: காந்திபுரம், கோயம்புத்தூர்"
                )}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              />

              <button
                type="button"
                onClick={getCurrentLocation}
                className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
              >
                📍{" "}
                {text(
                  "Use Current Location",
                  "தற்போதைய இருப்பிடத்தை பயன்படுத்தவும்"
                )}
              </button>

              {locationStatus && (
                <p className="mt-2 text-xs text-slate-500">
                  {locationStatus}
                </p>
              )}
            </div>

            {/* QUANTITY */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {text("Waste Quantity", "கழிவு அளவு")}
              </label>

              <select
                required
                value={quantity}
                onChange={(event) =>
                  handleQuantityChange(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              >
                <option value="">
                  {text(
                    "Select quantity",
                    "கழிவு அளவை தேர்ந்தெடுக்கவும்"
                  )}
                </option>

                <option value="small">
                  {text("Small", "சிறியது")}
                </option>

                <option value="medium">
                  {text("Medium", "நடுத்தரம்")}
                </option>

                <option value="large">
                  {text("Large", "பெரியது")}
                </option>

                <option value="very-large">
                  {text("Very Large", "மிகப் பெரியது")}
                </option>
              </select>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {text("Waste Category", "கழிவு வகை")}
              </label>

              <select
                required
                value={category}
                onChange={(event) =>
                  handleCategoryChange(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              >
                <option value="">
                  {text(
                    "Select category",
                    "கழிவு வகையை தேர்ந்தெடுக்கவும்"
                  )}
                </option>

                <option value="Plastic">
                  {text("Plastic", "பிளாஸ்டிக்")}
                </option>

                <option value="Organic">
                  {text("Organic", "உயிரியல் கழிவு")}
                </option>

                <option value="Paper">
                  {text("Paper", "காகிதம்")}
                </option>

                <option value="Metal">
                  {text("Metal", "உலோகம்")}
                </option>

                <option value="Glass">
                  {text("Glass", "கண்ணாடி")}
                </option>

                <option value="E-waste">
                  {text("E-waste", "மின்னணு கழிவு")}
                </option>

                <option value="Hazardous">
                  {text("Hazardous", "அபாயகரமான கழிவு")}
                </option>

                <option value="Mixed Waste">
                  {text("Mixed Waste", "கலப்பு கழிவு")}
                </option>
              </select>

              {aiResult && (
                <p className="mt-2 text-xs text-green-700">
                  {text(
                    `AI automatically selected ${aiResult.category}. You can manually correct it if necessary.`,
                    `AI தானாக ${aiResult.category} வகையை தேர்ந்தெடுத்துள்ளது. தேவைப்பட்டால் மாற்றலாம்.`
                  )}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {text("Description", "விவரம்")}
              </label>

              <textarea
                rows={5}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder={text(
                  "Describe the waste problem...",
                  "கழிவு பிரச்சினையை விவரிக்கவும்..."
                )}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              />
            </div>

            {/* PRIORITY */}
            <div className="rounded-xl border border-orange-300 bg-orange-50 p-5">
              <h3 className="text-sm font-semibold text-orange-800">
                🚨{" "}
                {text(
                  "Smart Priority",
                  "ஸ்மார்ட் முன்னுரிமை"
                )}
              </h3>

              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  {text(
                    "Priority Score",
                    "முன்னுரிமை மதிப்பெண்"
                  )}
                  :{" "}
                  <span className="font-bold">
                    {priorityScore}
                  </span>
                </p>

                <p>
                  {text(
                    "Priority Level",
                    "முன்னுரிமை நிலை"
                  )}
                  :{" "}
                  <span className="font-bold">
                    {priorityLevel}
                  </span>
                </p>
              </div>
            </div>

            {message && (
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || aiLoading}
              className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading
                ? text(
                    "AI Analyzing...",
                    "AI ஆய்வு செய்கிறது..."
                  )
                : loading
                ? text(
                    "Submitting...",
                    "சமர்ப்பிக்கப்படுகிறது..."
                  )
                : text(
                    "Submit Waste Report",
                    "கழிவு புகாரை சமர்ப்பிக்கவும்"
                  )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}