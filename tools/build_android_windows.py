"""Build Kavian using an installed Windows SDK; never silently use a test key."""
import argparse
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

def main():
    os.environ['PYTHONUTF8'] = '1'
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--sdk', type=Path, required=True)
    parser.add_argument('--java-home', type=Path, required=True)
    parser.add_argument('--build-tools', default='35.0.0')
    args = parser.parse_args()
    root = args.project.resolve()
    sdk = args.sdk.resolve()
    tools = sdk / 'build-tools' / args.build_tools
    java = args.java_home / 'bin' / 'java.exe'
    javac = args.java_home / 'bin' / 'javac.exe'
    platform = sdk / 'platforms' / 'android-35' / 'android.jar'
    for path in (java, javac, platform, tools/'aapt2.exe', tools/'zipalign.exe',
                 tools/'lib'/'d8.jar', tools/'lib'/'apksigner.jar'):
        if not path.is_file():
            parser.error(f'Missing prerequisite: {path}')
    build = root / '.local' / 'android-build-windows'
    # Delete only this script's fixed generated directory within the project.
    if build.is_symlink() or build.is_junction():
        parser.error('Refusing to clean a linked build directory')
    if build.exists():
        shutil.rmtree(build)
    for directory in ('classes', 'dex', 'assets/www'):
        (build/directory).mkdir(parents=True, exist_ok=True)
    dist = root/'dist'
    dist.mkdir(exist_ok=True)
    def run(*command):
        subprocess.run([str(x) for x in command], cwd=root, check=True)
    run(sys.executable, root/'tools'/'build_web.py')
    shutil.copytree(root/'web', build/'assets'/'www', dirs_exist_ok=True)
    run(tools/'aapt2.exe', 'compile', '--dir', root/'src/android/res', '-o', build/'resources.zip')
    run(tools/'aapt2.exe', 'link', '-o', build/'unsigned.apk', '-I', platform,
        '--manifest', root/'src/android/AndroidManifest.xml', '-A', build/'assets',
        build/'resources.zip', '--min-sdk-version', '26', '--target-sdk-version', '35')
    run(javac, '-source', '8', '-target', '8', '-encoding', 'UTF-8',
        '-bootclasspath', platform, '-d', build/'classes', root/'src/android/MainActivity.java')
    with zipfile.ZipFile(build/'classes.jar', 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in (build/'classes').rglob('*.class'):
            archive.write(path, path.relative_to(build/'classes').as_posix())
    run(java, '-cp', tools/'lib/d8.jar', 'com.android.tools.r8.D8', '--lib', platform,
        '--min-api', '26', '--output', build/'dex', build/'classes.jar')
    with zipfile.ZipFile(build/'unsigned.apk', 'a', zipfile.ZIP_DEFLATED) as archive:
        for path in (build/'dex').glob('*.dex'):
            archive.write(path, path.name)
    output = dist/'Kavian-0.5.3-unsigned.apk'
    run(tools/'zipalign.exe', '-f', '-p', '4', build/'unsigned.apk', output)
    run(tools/'zipalign.exe', '-c', '4', output)
    (dist/'Kavian-0.5.3-unsigned.sha256').write_text(
        hashlib.sha256(output.read_bytes()).hexdigest()+'  '+output.name+'\n', encoding='utf-8')
    print(f'Built aligned UNSIGNED APK: {output}')

if __name__ == '__main__':
    main()
