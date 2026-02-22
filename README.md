# higamathcontest.github.io
HiGA Math Contest を円滑に運営するための特設サイトです。<br>
開発者によるメモ書きとかしている


/contest, /register, /ranking は /contest内に統合

- /contest
	- top画面：コンテスト名、時間、問題数、/contest-accountへのリンク表示。SignInなら、”Enter”を表示しクリックで/contest/problemsへ遷移。!signInなら”Register”を表示しクリックで、/register画面へ遷移。時間表示*。
- /contest/register
	- register画面（すでにアカウントを持っている人の復活用フォームと、まだ作成していない新規作成用フォームの２つを用意）
- contest/problems
	- 問題一覧画面：問題一覧。ユーザーを取得して、正答済の問題は色で強調。時間表示*。
- /contest/problems/algebra/1/, /contest/questions/algebra/2...　（それぞれのページに電卓と解答欄。問題は直書き。Github覗かれたら終わるけど、それを禁止することを参加規約に明記。status == beforeならこれらのサイトにアクセスしたらredirectしみれないようにする）
- /contest/submissions　（正誤結果の表示・解答後ここへ移動）
- /contest/answer　（status == 公開, problemと同様にgithubに直書き。閲覧禁止。）
- /contest/ranking　（status == finishedの後、自動集計、反映。）
- /contest/account　usernameの変更とアカウントの削除用

*時間表示 （status == beforeなら開催までの時間、 == runningなら残り時間、 == finishedなら、”finished”を表示）
../problems, ../submissions, ../rankingはタブ切り替え


1. 参加登録(/register)にて、
    - ユーザー名
    - 学年
    - パスワード
    を保存。user_id（PK, authで生成）を持つ Record を INSERT し、それぞれ
    - username
    - grade
    に保存。 
    - Teams で告知する HiGA Key を入力する Input 欄を配置。database/contest-settings を参照して判定。
    - 規約同意の旨の確認のための Checkbox を配置する。
    を保存する

2. user_idはlocalStorageに保存しない（書き換えが生まれる可能性あり && 一般的な手法）。usernameは単なる表示名。authで判定。JWTを発行しログイン状態を保持。

3. database は以下の内容を保存する。（重要）

    - ① Pprofiles：ユーザー情報
        - user_id uuid (auth.uid()) Primary Key
        - username text Unique
        - grade text
        - score int default 0
        - penalty int default 0

	RLS：
	select: only user own.
	update: only user own.
	insert: only when logIn.
        
    - ② Problems：問題
        - problem_id uuid Primary Key
        - score int
        - problem_number int
        - correct text could not select(RLS)
	
    - ③ Submissions：回答提出
        - id uuid Primary Key
        - user_id uuid foreign Key
        - problem_id uuid foreign Key
        - answer text
        - is_correct boolean use “check_and_sumbit function”
        - submitted_at timestamp

    - ④ contest-settingsコンテスト情報
        - status before/running/finished
        - start_time timestamp
        - end_time timestamp
        - higa_key text
        - limit int
        - penalty_minutes int

    Row Level Security (RLS) を用いて、Problems/correct等を取得できないようにできるはず

4. Databaseで実装する関数
    - ① check_and_submit 関数
        以下の３つを連続して実行する。
        - 回答回数が上限に達していないかの判定
            - submissions内のuser_idが一致するrecordの個数（かつproblem_idも一致）<=回数上限がTrueなら次へ。Falseならエラー表示。
        - SubmissionsへのrecordのINSERT
        - 正誤判定
            - Problems/correct == answerがTrueならprofilesのscoreを更新, Falseならprofilesのpenaltyを更新。

5. 大会実施全体に関わることについて
    - コンテスト問題・回答ページの非表示
        - supabaseにて制御。(before, running, finished)で状態を管理し、必要に応じてリダイレクト。時間はsupabaseに保存。
        - 潜り込めそうだが、そこは参加規約に明記（あとは良心等を信じる）
    - 制限時間等の表示
        - 上記と同様に(before, running, finished)で状態を管理し、開催まで◯日、残り時間◯分、終了みたいに切り替える。
    - 順位表の表示
        - before/runningはまだ始まっていない、開催中。終了後公開等のメッセージ。finishedご、学年別と、全体順位表を表示。


8. Privacy Policy について
    - Supabaseでどのように情報が扱われるかと、個人を特定できる情報は一切扱わないことを明記したページがあるべき



## その他編集すべきことをまとめた（案）・やりたい機能とかもまとめていこう
ルール・概要・規約をどのページに置くか、少し散らばり気味では？
運営を脅かすようなサイバー的侵入・破壊の厳禁を記載。
複数アカウント所持の厳禁
