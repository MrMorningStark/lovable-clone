import React, { useState } from 'react';
import { Search, Archive, Delete, Mail, Star, RefreshCw, Settings, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

interface Email {
    from: string;
    subject: string;
    message: string;
    time?: string;
}

interface GmailUIProps {
    emails?: Email[];
}

interface SelectedEmail extends Email {
    index: number;
}

const GmailUI: React.FC<GmailUIProps> = ({ emails = [] }) => {
    const [selectedEmail, setSelectedEmail] = useState<SelectedEmail | null>(null);
    const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());

    const handleEmailClick = (email: Email, index: number) => {
        setSelectedEmail({ ...email, index });
    };

    const handleSelectEmail = (index: number) => {
        const newSelected = new Set(selectedEmails);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedEmails(newSelected);
    };

    const formatTime = (timeStr?: string): string => {
        if (!timeStr) return 'Just now';
        return timeStr;
    };

    const getInitials = (name?: string): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const truncateText = (text?: string, maxLength: number = 100): string => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    if (selectedEmail) {
        return (
            <div className="h-full flex flex-col bg-gray-800 text-gray-100">
                {/* Email Header */}
                <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedEmail(null)}
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <Archive className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
                        <Delete className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
                        <Mail className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                            {selectedEmail.index + 1} of {emails.length}
                        </span>
                        <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-gray-200" />
                        <ChevronRight className="w-4 h-4 cursor-pointer hover:text-gray-200" />
                    </div>
                </div>

                {/* Email Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-normal text-gray-100 mb-4">
                            {selectedEmail.subject || 'No Subject'}
                        </h1>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">{getInitials(selectedEmail.from)}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-100">{selectedEmail.from}</span>
                                    <span className="text-gray-400 text-sm">
                                        &lt;{selectedEmail.from?.toLowerCase().replace(/\s+/g, '.')}@gmail.com&gt;
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>to me</span>
                                    <span>{formatTime(selectedEmail.time)}</span>
                                </div>
                            </div>
                            <Star className="w-5 h-5 text-gray-400 hover:text-yellow-400 cursor-pointer" />
                        </div>

                        <div className="prose max-w-none">
                            <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                                {selectedEmail.message || 'No content available'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-800 text-gray-100">
            {/* Gmail Header */}
            <div className="bg-gray-900 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Menu className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-200" />
                        <div className="flex items-center gap-2">
                            <Mail className="w-8 h-8 text-red-500" />
                            <span className="text-2xl font-normal text-gray-300">Gmail</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-200" />
                        <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-200" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search mail"
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
                <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedEmails(new Set(emails.map((_, i) => i)));
                        } else {
                            setSelectedEmails(new Set());
                        }
                    }}
                />
                <Archive className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-200" />
                <Delete className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-200" />
                <Mail className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-200" />
                <div className="ml-auto text-sm text-gray-400">
                    {emails.length} of {emails.length}
                </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-auto">
                {emails.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                            <p>No emails found</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {emails.map((email, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors ${selectedEmails.has(index) ? 'bg-blue-900/50' : ''
                                    }`}
                                onClick={() => handleEmailClick(email, index)}
                            >
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                    checked={selectedEmails.has(index)}
                                    onChange={() => handleSelectEmail(index)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Star className="w-5 h-5 text-gray-400 hover:text-yellow-400 cursor-pointer" />

                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-medium text-sm">{getInitials(email.from)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-100 truncate">
                                            {email.from || 'Unknown Sender'}
                                        </span>
                                        <span className="text-sm text-gray-400 flex-shrink-0">{formatTime(email.time)}</span>
                                    </div>
                                    <div className="text-sm text-gray-100 font-medium truncate">
                                        {email.subject || 'No Subject'}
                                    </div>
                                    <div className="text-sm text-gray-400 truncate">{truncateText(email.message)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GmailUI;