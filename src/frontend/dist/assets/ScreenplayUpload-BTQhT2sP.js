import { c as createLucideIcon, j as jsxRuntimeExports, S as Skeleton, u as ue, r as reactExports } from "./index-Dpuigoe9.js";
import { u as useDeleteScreenplay, C as Card, a as CardHeader, b as CardTitle, c as CardContent, B as Badge, d as Button, P as Play, L as LoaderCircle, e as useAddScreenplay, f as useListScreenplays, g as CardDescription, h as Label, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./select-BogIh9jA.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
];
const FileText = createLucideIcon("file-text", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M12 3v12", key: "1x0j5s" }],
  ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
];
const Upload = createLucideIcon("upload", __iconNode);
function ScreenplayList({
  screenplays,
  isLoading,
  onSelect
}) {
  const deleteScreenplay = useDeleteScreenplay();
  const handleDelete = async (id, title) => {
    try {
      await deleteScreenplay.mutateAsync(id);
      ue.success(`"${title}" deleted`);
    } catch {
      ue.error("Failed to delete screenplay");
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display", children: "Your Screenplays" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 w-full" }, i)) })
    ] });
  }
  if (screenplays.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "screenplay-list", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display", children: "Your Screenplays" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: screenplays.map((screenplay) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors",
        "data-ocid": `screenplay-row-${screenplay.id}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium truncate", children: screenplay.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs mt-0.5", children: screenplay.language })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 ml-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "default",
                size: "sm",
                onClick: () => onSelect(screenplay.id),
                "data-ocid": "play-screenplay",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-3.5 h-3.5 mr-1" }),
                  "Play"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => handleDelete(screenplay.id, screenplay.title),
                disabled: deleteScreenplay.isPending,
                "data-ocid": "delete-screenplay",
                children: deleteScreenplay.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ]
      },
      screenplay.id
    )) })
  ] });
}
const SUPPORTED_LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-PT", label: "Portuguese" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Mandarin)" }
];
function ScreenplayUpload({
  onScreenplaySelect
}) {
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [language, setLanguage] = reactExports.useState("en-US");
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const addScreenplay = useAddScreenplay();
  const { data: screenplays = [], isLoading: isLoadingScreenplays } = useListScreenplays();
  const handleDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = reactExports.useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".fountain") || file.name.endsWith(".txt"))) {
      setSelectedFile(file);
    } else {
      ue.error("Please upload a .fountain or .txt file");
    }
  }, []);
  const handleFileSelect = reactExports.useCallback(
    (e) => {
      var _a;
      const file = (_a = e.target.files) == null ? void 0 : _a[0];
      if (file) setSelectedFile(file);
    },
    []
  );
  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const text = await selectedFile.text();
      const title = selectedFile.name.replace(/\.(fountain|txt)$/i, "");
      const id = await addScreenplay.mutateAsync({
        title,
        language,
        content: text
      });
      ue.success(`"${title}" uploaded!`);
      setSelectedFile(null);
      onScreenplaySelect(id);
    } catch (error) {
      console.error("Upload error:", error);
      ue.error("Failed to upload screenplay");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-8 max-w-4xl space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2 border-dashed border-primary/20 bg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-primary" }),
          "Upload Screenplay"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Upload a Fountain-formatted screenplay file to start your table read" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            className: `relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "file",
                  accept: ".fountain,.txt",
                  onChange: handleFileSelect,
                  className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                  disabled: addScreenplay.isPending,
                  "data-ocid": "file-upload-input"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4 pointer-events-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-8 h-8 text-primary" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: selectedFile ? selectedFile.name : "Drop your screenplay here" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "or click to browse — .fountain or .txt files" })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "language", children: "Primary Language" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: language,
              onValueChange: setLanguage,
              disabled: addScreenplay.isPending,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "language", "data-ocid": "language-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select language" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SUPPORTED_LANGUAGES.map((lang) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: lang.value, children: lang.label }, lang.value)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleUpload,
            disabled: !selectedFile || addScreenplay.isPending,
            className: "w-full",
            size: "lg",
            "data-ocid": "upload-submit",
            children: addScreenplay.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Uploading…"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4 mr-2" }),
              "Upload & Start Table Read"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScreenplayList,
      {
        screenplays,
        isLoading: isLoadingScreenplays,
        onSelect: onScreenplaySelect
      }
    )
  ] });
}
export {
  ScreenplayUpload
};
