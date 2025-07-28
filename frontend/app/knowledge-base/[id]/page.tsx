'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Breadcrumb, BreadcrumbItem } from 'flowbite-react';
import { ArrowLeft, Calendar, BookOpen, Tag } from 'lucide-react';
import { MainLayout, ProtectedRoute } from '../../../src/app/shared/components';
import { LoadingSpinner } from '../../../src/app/shared/components';
import { articlesApi } from '../../../src/lib/api';
import { formatFullDateTime } from '../../../src/lib/utils';
import { useAuth } from '../../../src/contexts/AuthContext';
import type { Article } from '../../../src/app/shared/types';
import { getRichTextHTML } from '../../../src/lib/utils';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await articlesApi.getById(articleId);
        setArticle(data);
      } catch (error) {
        console.error('Failed to fetch article:', error);
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <LoadingSpinner text="Loading article..." />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error || !article) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Article Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={handleBack} color="gray">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <BreadcrumbItem href="/knowledge-base">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </BreadcrumbItem>
            <BreadcrumbItem>{article.title}</BreadcrumbItem>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                color="gray"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <Card className="max-w-4xl">
            <div className="space-y-6">
              {/* Article Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {article.title}
                </h1>

                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">{article.category?.name}</span>
                    <span>•</span>
                    <span>{article.subCategory?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatFullDateTime(article.createdAt)}</span>
                  </div>
                  {article.updatedAt !== article.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatFullDateTime(article.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: getRichTextHTML(article.content) 
                  }}
                  className="min-h-[200px] text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}