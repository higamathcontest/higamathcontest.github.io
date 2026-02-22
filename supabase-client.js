// supabase-client.js
// Supabase クライアントを生成し window.supabase としてグローバルに公開する。
// register.js（module）と signup.js（通常script）の両方から参照できるようにする。

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL  = "https://tevdhsugikscvgvesvhr.supabase.co"  // ← 実際のURLに変更
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldmRoc3VnaWtzY3ZndmVzdmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcwMzcsImV4cCI6MjA4NzI3MzAzN30.Puc5_sqUxAqtojMc3nF8uJqjellJKPbPaLlROFaQQoc"  // ← 実際のキーに変更

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)