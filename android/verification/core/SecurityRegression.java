package com.saeedsh.islandlink.core;
import java.io.*;
import java.net.InetAddress;
import java.lang.reflect.*;
import java.util.*;
public class SecurityRegression {
    static int checks;
    static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);checks++;System.out.println("PASS "+message);}
    static class FixtureLink extends Link {
        FixtureLink(String id){super(new Info(),s->{});info.deviceId=id;}
        public boolean isBluetooth(){return false;}
        public String address(){return "fixture";}
        public boolean send(Packet p){return true;}
        protected void startReading(){}
        protected void closeTransport(){}
    }
    @SuppressWarnings("unchecked")
    public static void main(String[] args)throws Exception{
        String a="a".repeat(32),b="b".repeat(32),n1=BtAuth.nonce(),n2=BtAuth.nonce();
        Certs.Identity identity=Certs.create(a),other=Certs.create(b);
        byte[] transcript=BtAuth.transcript(a,b,n1,n2,Certs.sha256Hex(identity.certDer),Certs.sha256Hex(other.certDer));
        String proof=BtAuth.sign(identity,transcript);BtAuth.verify(identity.cert,transcript,proof);check(true,"valid private-key proof is accepted");
        boolean rejected=false;try{BtAuth.verify(other.cert,transcript,proof);}catch(Exception e){rejected=true;}
        check(rejected,"public certificate copied without private key cannot authenticate");
        byte[] fresh=BtAuth.transcript(a,b,n1,BtAuth.nonce(),Certs.sha256Hex(identity.certDer),Certs.sha256Hex(other.certDer));
        rejected=false;try{BtAuth.verify(identity.cert,fresh,proof);}catch(Exception e){rejected=true;}
        check(rejected,"signature cannot be replayed on a fresh connection");
        byte[] seed=BtAuth.seed(),sealed=BtAuth.sealSeed(other.cert,seed);
        check(Arrays.equals(seed,BtAuth.openSeed(other,sealed)),"session key is recoverable only by its intended RSA recipient");
        rejected=false;try{BtAuth.openSeed(identity,sealed);}catch(Exception e){rejected=true;}
        check(rejected,"another private key cannot recover the Bluetooth session secret");
        byte[] key=BtAuth.sessionKey(seed,transcript),plain="private phone data".getBytes(Link.UTF8);
        byte[] encrypted=BtAuth.crypt(true,key,transcript,0,plain);
        check(Arrays.equals(plain,BtAuth.crypt(false,key,transcript,0,encrypted)),"authenticated Bluetooth frames preserve exact bytes");
        encrypted[0]^=1;rejected=false;try{BtAuth.crypt(false,key,transcript,0,encrypted);}catch(Exception e){rejected=true;}
        check(rejected,"modified Bluetooth ciphertext is rejected");
        File dir=new File(args[0]);dir.mkdirs();
        Core c=new Core(new Core.Host(){
            public File dataDir(){return dir;}public File cacheDir(){return dir;}
            public String deviceName(){return "test";}public String deviceType(){return "phone";}
            public Core.Log log(){return s->{};}public List<InetAddress> broadcastAddresses(){return Collections.emptyList();}
        },new Core.Events(){
            public void onDevicesChanged(){}public void onPairRequest(Core.Device d){}public void onPaired(Core.Device d){}
            public void onUnpaired(Core.Device d){}public void onPairFailed(Core.Device d,String r){}public void onConnected(Core.Device d){}
            public void onDisconnected(Core.Device d){}public void onPacket(Core.Device d,Packet p,Link l){}
        });
        Field field=Core.class.getDeclaredField("devices");field.setAccessible(true);
        Map<String,Core.Device> devices=(Map<String,Core.Device>)field.get(c);
        Core.Device first=new Core.Device(a),second=new Core.Device(b);FixtureLink al=new FixtureLink(a),bl=new FixtureLink(b);
        // Device uses concrete LAN/Bluetooth types; use real BtLinks with inert streams for selection only.
        Link.Info ai=new Link.Info();ai.deviceId=a;Link.Info bi=new Link.Info();bi.deviceId=b;
        first.bt=new BtLink(ai,new Link.LineReader(new ByteArrayInputStream(new byte[0]),1024),new ByteArrayOutputStream(),()->{},"A",dir,s->{});
        second.bt=new BtLink(bi,new Link.LineReader(new ByteArrayInputStream(new byte[0]),1024),new ByteArrayOutputStream(),()->{},"B",dir,s->{});
        first.paired=second.paired=true;first.lastSeen=2;second.lastSeen=1;devices.put(a,first);devices.put(b,second);
        check(c.activeDevice()==first,"first default target is selected");
        second.lastSeen=100;check(c.activeDevice()==first,"new traffic on another PC cannot change command destination");
        check(c.selectDevice(b)&&c.activeDevice()==second,"explicit selection changes command destination");
        second.bt.close();check(c.activeDevice()==null,"disconnected selected PC does not silently fall back to another");
        check(c.selectDevice(a)&&c.activeDevice()==first,"user can select the remaining paired PC");
        check(!c.selectDevice("unknown"),"unknown PC cannot become selected");
        al.close();bl.close();c.close();
        System.out.println("ALL "+checks+" SECURITY/POLICY CHECKS PASSED");
    }
}
