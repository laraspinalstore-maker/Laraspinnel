"use client";

import React, { useEffect, useState } from "react";
import ImageUrlDialog from "./ImageUrlDialog";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      ImageExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[250px] p-3 md:p-4 bg-white text-brand-black",
      },
    },
  });

  // Keep editor content in sync when value changes (e.g. on load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    setImageDialogOpen(true);
  };

  const handleImageUrlConfirm = (url: string) => {
    setImageDialogOpen(false);
    editor?.chain().focus().setImage({ src: url }).run();
  };

  return (
    <>
    <ImageUrlDialog
      isOpen={imageDialogOpen}
      onConfirm={handleImageUrlConfirm}
      onCancel={() => setImageDialogOpen(false)}
    />
    <div className="border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
      {/* Toolbar */}
      <div className="bg-brand-light-gray border-b border-brand-border p-2 flex flex-wrap gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("bold") ? "bg-neutral-200 font-bold" : ""
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("italic") ? "bg-neutral-200" : ""
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("heading", { level: 1 }) ? "bg-neutral-200" : ""
          }`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("heading", { level: 2 }) ? "bg-neutral-200" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("bulletList") ? "bg-neutral-200" : ""
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("orderedList") ? "bg-neutral-200" : ""
          }`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-neutral-200 text-brand-black ${
            editor.isActive("blockquote") ? "bg-neutral-200" : ""
          }`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>

        {/* Add Image */}
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-neutral-200 text-brand-black"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-brand-border mx-1 my-auto"></div>

        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-neutral-200 text-brand-black disabled:opacity-30"
          title="Undo"
        >
          <Undo size={16} />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-neutral-200 text-brand-black disabled:opacity-30"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Basic content style rules inside editor */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 250px;
          outline: none;
        }
        .ProseMirror h1 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        .ProseMirror h2 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid var(--color-primary, #1e8a4c);
          padding-left: 1rem;
          font-style: italic;
          color: #4b5563;
          margin-bottom: 0.75rem;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
    </>
  );
}
