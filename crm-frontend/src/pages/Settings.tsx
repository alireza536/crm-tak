import "./Settings.css";

export default function Settings() {

  return (

    <div className="settingsPage">

      {/* Header */}

      <div className="settingsHeader">

        <div>

          <h1>تنظیمات سیستم</h1>

          <p>

            مدیریت اطلاعات شرکت و تنظیمات CRM

          </p>

        </div>

        <button className="saveSettings">

          ذخیره تنظیمات

        </button>

      </div>

      {/* Card */}

      <div className="settingsCard">

        <h2>

          اطلاعات شرکت

        </h2>

        <div className="settingsGrid">

          <div className="formGroup">

            <label>نام شرکت</label>

            <input placeholder="CRM TAK" />

          </div>

          <div className="formGroup">

            <label>شماره تماس</label>

            <input placeholder="09120000000" />

          </div>

          <div className="formGroup">

            <label>ایمیل</label>

            <input placeholder="info@gmail.com" />

          </div>

          <div className="formGroup">

            <label>آدرس</label>

            <input placeholder="تهران..." />

          </div>

        </div>

      </div>

    </div>

  );

}