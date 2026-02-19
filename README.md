# higamathcontest.github.io
Special site to run HiGA Math Contest

## URLの整理（コンテスト）

- /contest（問題一覧、正解した問題は強調）
- /contest/question1, /contest/question2...　（各問題・解答欄付き）
- /contest/submission　（正誤結果の表示・解答後ここへ移動）
- /contest/answer　（解説一覧・コンテスト終了後公開）

## データの管理をどうしよう

1. 参加登録(/register)にて、
    - ユーザー名
    - 学年
    - HiGA Key (Teams で告知)（これは保存しない・正しい Key を入れないと回答できないようにする）
        - Key は database上に保存。 database を参照して正誤判定
    - 規約同意の旨の確認（これは保存しない・チェックを入れないと回答できないようにする）
    を保存する
2. ユーザー名・学年を database上に保存。ユーザー名は、ブラウザの localStorage にも保存。JSで、ユーザー名を localStorageからfetch, databse上で探すKeyになる。例えば、コンテストのページ(/contest)で表示される問題一覧で正答した問題の行は色をつける制御は、ユーザー名をlocalStorageからfetchし、ユーザーに紐づいた正答できた問題をdatabaseで参照することで実現できる。
3. database は以下の内容を保存する。
    - 基本情報(/profiles)
        - ユーザー名(../user) Primary Key
        - 学年（../grade）
        - 獲得スコア
    - 解答（/answer）
        - 問題番号(../q-number)
        - 正解(非負整数)（../q-answer）
        - スコア（../q-score）
    - 解答（/submission）
        - ユーザー名(../user)←(/profilesから参照)
        - 問題番号(../q-number)
        - 回答（../user_input）
        - 正誤判定（../is_correct）←jsで判定
        - 回答時間（../submitted_at） 絶対時間ではなく、開始時刻からの経過時間
4. 実際の運用
    - 回答数の制限について
        - /submission から、ユーザー名が、localStorageに保存されたものと一致するレコード数を取得し、レコード数<回答数上限を確認。
            -Trueなら回答可、Falseなら回答不可。
localStorageはあくまで接続Key
適切に Privacy Policy を制定

5. アクシデントへの対応
    - localStorageの削除
        - 故意の操作、不可避的なインシデントによって、localStorageが消えた場合は、ユーザーが再入力できる機能を備える

6. 大会実施

## 情報の整理
ルール・概要・規約をどのページに置くか、少し散らばり気味