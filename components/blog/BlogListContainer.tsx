"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Calendar, User, FileText } from "lucide-react";
import Image from "next/image";

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  tags?: string[];
  publishedAt?: string;
  slug: string;
}

interface BlogListContainerProps {
  initialPosts: BlogPost[];
}

export default function BlogListContainer({ initialPosts }: BlogListContainerProps) {
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // Get unique list of tags
  const tags = Array.from(new Set(initialPosts.flatMap((p) => p.tags || []))).filter(Boolean);

  useEffect(() => {
    let results = [...initialPosts];

    // Search filter
    if (searchTerm) {
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTag !== "All") {
      results = results.filter((p) => p.tags?.includes(selectedTag));
    }

    setFilteredPosts(results);
  }, [searchTerm, selectedTag, initialPosts]);

  return (
    <div className="space-y-10">
      {/* Search & Tag Filter Bar */}
      <div className="bg-white border border-brand-border rounded-2xl p-3 md:p-5 space-y-4 shadow-card">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blog articles by title or keyword..."
            className="w-full h-11 pl-10 pr-4 bg-brand-light-gray/50 border border-brand-border rounded-xl text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {tags.length > 0 && (() => {
          const TagButtons = () => (
            <>
              <button
                onClick={() => setSelectedTag("All")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${selectedTag === "All"
                    ? "bg-primary-tint text-primary-text border-primary/20"
                    : "bg-white text-brand-black border-brand-border hover:bg-brand-light-gray"
                  }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${selectedTag === tag
                      ? "bg-primary-tint text-primary-text border-primary/20"
                      : "bg-white text-brand-black border-brand-border hover:bg-brand-light-gray"
                    }`}
                >
                  {tag}
                </button>
              ))}
            </>
          );

          return (
            <div className="pt-4 text-xs font-semibold select-none">
              <details className="group">
                <summary className="cursor-pointer text-brand-gray uppercase tracking-wider font-bold flex items-center justify-between outline-none">
                  <span>Categories</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-normal bg-brand-light-gray text-brand-black px-2 py-0.5 rounded-full group-open:hidden max-w-[150px] truncate">
                      {selectedTag !== "All" ? selectedTag : `${tags.length} Topics`}
                    </span>
                    <span className="text-[10px] font-normal bg-brand-light-gray text-brand-black px-2 py-0.5 rounded-full hidden group-open:inline-block">
                      Close
                    </span>
                  </div>
                </summary>
                <div className="flex flex-col flex-wrap content-start items-start gap-2 pt-3 max-h-[140px] overflow-x-auto pb-2 w-full">
                  <TagButtons />
                </div>
              </details>
            </div>
          );
        })()}
      </div>

      {/* Listing Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center text-brand-gray border border-brand-border bg-white rounded-2xl max-w-md mx-auto space-y-4">
          <FileText size={48} className="mx-auto text-neutral-300" />
          <h3 className="font-semibold text-brand-black">No articles found</h3>
          <p className="text-xs">Adjust your search parameters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              prefetch={true}
              className="group bg-white border border-brand-border rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-light-gray">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    sizes="(max-w-768px) 100vw, 300px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <FileText size={40} className="opacity-20" />
                  </div>
                )}
                {post.tags?.[0] && (
                  <span className="absolute top-3.5 left-3.5 bg-primary-tint text-primary-text text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-primary/10 shadow-sm">
                    {post.tags[0]}
                  </span>
                )}
              </div>

              {/* Text details */}
              <div className="p-3 md:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-brand-black text-lg group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-brand-gray line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-brand-gray pt-4 mt-2">
                  <div className="flex items-center gap-1">
                    <User size={12} className="text-neutral-400" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar size={12} className="text-neutral-400" />
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
