import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Code, Trophy, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Improve Your Coding Skills</span>
                    <span className="block text-indigo-600">With AI-Powered Feedback</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Join thousands of developers who are improving their coding skills with interactive challenges and real-time feedback!
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                    {isAuthenticated ? (
                        <Link
                            to="/problems"
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                        >
                            Start Coding
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    ) : (
                        <div className="space-x-4">
                            <Link
                                to="/login"
                                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-24">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Code className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Coding Challenges</h3>
                        <p className="mt-2 text-gray-500">
                            Practice with carefully crafted coding challenges across different difficulty levels.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Brain className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">AI Feedback</h3>
                        <p className="mt-2 text-gray-500">
                            Get instant, intelligent feedback on your code with our AI-powered analysis.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Trophy className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Track Progress</h3>
                        <p className="mt-2 text-gray-500">
                            Monitor your improvement with detailed statistics and achievements.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}