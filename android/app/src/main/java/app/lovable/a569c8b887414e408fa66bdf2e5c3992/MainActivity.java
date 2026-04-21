package app.arenacopa.www;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "ArenaMandatoryUpdate";

    private AppUpdateManager appUpdateManager;
    private ActivityResultLauncher<IntentSenderRequest> updateLauncher;
    private boolean updateFlowRunning = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        appUpdateManager = AppUpdateManagerFactory.create(this);
        updateLauncher = registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                updateFlowRunning = false;

                if (result.getResultCode() != Activity.RESULT_OK) {
                    Log.w(TAG, "Immediate update canceled or failed.");
                    enforceManualUpdate();
                }
            }
        );

        checkForMandatoryUpdate();
    }

    @Override
    public void onResume() {
        super.onResume();
        checkForMandatoryUpdate();
    }

    private void checkForMandatoryUpdate() {
        if (appUpdateManager == null || updateFlowRunning) {
            return;
        }

        appUpdateManager
            .getAppUpdateInfo()
            .addOnSuccessListener(this::handleUpdateInfo)
            .addOnFailureListener(error -> Log.e(TAG, "Failed to check for updates.", error));
    }

    private void handleUpdateInfo(AppUpdateInfo appUpdateInfo) {
        final int availability = appUpdateInfo.updateAvailability();
        final boolean immediateAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE);
        final boolean updateAvailable = availability == UpdateAvailability.UPDATE_AVAILABLE;
        final boolean updateInProgress =
            availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;

        if (updateInProgress || (updateAvailable && immediateAllowed)) {
            startImmediateUpdate(appUpdateInfo);
            return;
        }

        if (updateAvailable) {
            Log.w(TAG, "Update available, but immediate flow is not allowed. Redirecting to Play Store.");
            enforceManualUpdate();
        }
    }

    private void startImmediateUpdate(AppUpdateInfo appUpdateInfo) {
        try {
            updateFlowRunning = appUpdateManager.startUpdateFlowForResult(
                appUpdateInfo,
                updateLauncher,
                AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
            );

            if (!updateFlowRunning) {
                Log.w(TAG, "Google Play did not start the immediate update flow.");
                enforceManualUpdate();
            }
        } catch (Exception error) {
            Log.e(TAG, "Unable to start the immediate update flow.", error);
            enforceManualUpdate();
        }
    }

    private void enforceManualUpdate() {
        Toast.makeText(
            this,
            "Existe uma nova versao obrigatoria do app. Atualize para continuar.",
            Toast.LENGTH_LONG
        ).show();

        final Intent playStoreIntent = new Intent(
            Intent.ACTION_VIEW,
            Uri.parse("market://details?id=" + getPackageName())
        );
        playStoreIntent.setPackage("com.android.vending");
        playStoreIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            startActivity(playStoreIntent);
        } catch (ActivityNotFoundException error) {
            Log.w(TAG, "Play Store app not available. Opening browser fallback.", error);

            final Intent webIntent = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=" + getPackageName())
            );
            webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(webIntent);
        } finally {
            finishAffinity();
        }
    }
}
